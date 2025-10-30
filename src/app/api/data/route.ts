
import { NextResponse, NextRequest } from 'next/server';
import { firebaseAdminFirestore } from '@/lib/firebase-admin';
import { getUserIdFromToken, userIsAdminFromToken, userIsManagerFromToken } from '@/lib/auth-tools';
import { Query } from 'firebase-admin/firestore';

interface ApiRequest {
    name: string;
    collection: string;
    queries?: any[];
    singleDoc?: boolean;
    docId?: string;
}

export async function POST(request: NextRequest) {
    console.log('[api/data POST] Started');
    try {
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('[api/data POST] Request body:', body);

        const db = firebaseAdminFirestore;

        // Handle data fetching (batch)
        if (body.requests) {
            console.log('[api/data POST] Handling batch data fetch request');
            const { requests } = body;

            if (!Array.isArray(requests)) {
                return NextResponse.json({ error: 'Invalid request body, expected "requests" array' }, { status: 400 });
            }

            const results: { [key: string]: any } = {};
            const promises = requests.map(async (req: ApiRequest) => {
                try {
                    console.log(`[api/data POST] Processing sub-request: ${req.name}`);
                    const { name, collection: collectionName, queries, singleDoc, docId } = req;
        
                    let finalDocId = docId;
                    if (docId === '{userId}') {
                        finalDocId = userId;
                    }

                    if (singleDoc && finalDocId) {
                        console.log(`[api/data POST] Fetching single doc: ${collectionName}/${finalDocId}`);
                        const docRef = db.collection(collectionName).doc(finalDocId);
                        const docSnap = await docRef.get();
                        if (docSnap.exists) {
                            results[name] = { id: docSnap.id, ...docSnap.data() };
                        } else {
                            results[name] = null;
                        }
                    } else {
                        console.log(`[api/data POST] Fetching collection: ${collectionName}`);
                        let q: Query = db.collection(collectionName);
                        if (queries) {
                            console.log('Applying queries:', queries);
                            queries.forEach((q_part: any) => {
                                const qValue = q_part.value === '{userId}' ? userId : q_part.value;
                                if (q_part.type === 'where') {
                                    q = q.where(q_part.field, q_part.operator, qValue);
                                } else if (q_part.type === 'orderBy') {
                                    q = q.orderBy(q_part.field, q_part.direction);
                                } else if (q_part.type === 'limit') {
                                    q = q.limit(q_part.value);
                                }
                            });
                        }

                        const querySnapshot = await q.get();
                        const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        console.log(`Fetched ${data.length} documents from ${collectionName}`);

                        if (singleDoc) {
                            results[name] = data.length > 0 ? data[0] : null;
                        } else {
                            results[name] = data;
                        }
                    }
                    console.log(`[api/data POST] Sub-request ${name} successful.`);
                } catch (err) {
                    console.error(`[api/data POST] Error processing sub-request "${req.name}":`, err);
                    results[req.name] = { error: `Failed to fetch ${req.name}` };
                }
            });

            await Promise.all(promises);
            console.log('Batch fetch complete. Returning results:', results);
            return NextResponse.json(results);
        }

        // Handle document creation
        if (body.collection && body.data) {
            console.log(`Handling document creation in collection: ${body.collection}`);
            const { collection: collectionName, data } = body;

            const dataToCreate = {
                ...data,
                createdAt: new Date().toISOString(),
                createdBy: userId,
            };

            const docRef = await db.collection(collectionName).add(dataToCreate);
            console.log(`Document created with ID: ${docRef.id}`);
            return NextResponse.json({ success: true, id: docRef.id });
        }

        console.log('Invalid request body structure');
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    } catch (error) {
        console.error('Critical error in POST /api/data:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { collection: collectionName, action } = body; // Destructure 'action'
        const db = firebaseAdminFirestore;

        if (action === 'batchUpdateStatus' && collectionName === 'transactions') {
            const { transactions: transactionsToUpdate } = body; // Expect a 'transactions' array
            if (!Array.isArray(transactionsToUpdate) || transactionsToUpdate.length === 0) {
                return NextResponse.json({ error: 'Missing or invalid transactions array for batch update' }, { status: 400 });
            }

            const batch = db.batch();
            for (const txUpdate of transactionsToUpdate) {
                const { id, newStatus, statusType, deliveryStatus, settlementStatus } = txUpdate;
                if (!id || !statusType || !newStatus) {
                    // Log specific problematic transaction for debugging
                    console.error(`[api/data PUT] Missing fields in batch transaction update for ID: ${id}. Update object:`, txUpdate);
                    return NextResponse.json({ error: `Missing required fields for transaction ID ${id} in batch update` }, { status: 400 });
                }

                const txDocRef = db.collection(collectionName).doc(id);
                let updateData: any = { [statusType]: newStatus };

                // If 'Cancel' action, both deliveryStatus and settlementStatus might be explicitly set
                if (deliveryStatus !== undefined && settlementStatus !== undefined) {
                    updateData.deliveryStatus = deliveryStatus;
                    updateData.settlementStatus = settlementStatus;
                }
                
                batch.update(txDocRef, updateData);
            }
            await batch.commit();
            console.log(`[api/data PUT] Successfully committed batch update for ${transactionsToUpdate.length} transactions.`);
            return NextResponse.json({ success: true, message: `Batch update successful for ${transactionsToUpdate.length} transactions.` });
        }

        const { docId, data } = body;
        
        if(!collectionName || !docId || !data) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const docRef = db.collection(collectionName).doc(docId);
        
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        const docData = docSnap.data();
        if (!docData) {
            return NextResponse.json({ error: 'Document data is missing' }, { status: 500 });
        }

        // Rules check via code (db will also check permissions but better to avoid contacting the db server if possible)
        var requesterIsAdmin = await userIsAdminFromToken(request);
        var requesterIsManager = await userIsManagerFromToken(request); // Admins will also be managers
        var allowed = false;
        // check for transactions (managers or participang users)
        if (collectionName=='transactions') {
            allowed=(requesterIsManager==true) || (!docData.participants || !docData.participants.includes(userId))
        } else {
            // Any other collection requires admin privileges
            allowed=(requesterIsAdmin==true)
        }
        if (!allowed){
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await docRef.update(data);
        console.log(`[api/data PUT] Successfully updated single document: ${collectionName}/${docId}`);
        return NextResponse.json({ success: true, message: `Document ${collectionName}/${docId} updated successfully.` });

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('[api/data PUT] Error:', errorMessage);
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requesterIsAdmin = await userIsAdminFromToken(request);
        if ( !requesterIsAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        const { collection: collectionName, docId } = await request.json();

        if(!collectionName || !docId) {
             return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = firebaseAdminFirestore;
        const docRef = db.collection(collectionName).doc(docId);

        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        const docData = docSnap.data();
        if (!docData) {
            return NextResponse.json({ error: 'Document data is missing' }, { status: 500 });
        }
        if(collectionName === 'transactions' && (!docData.participants || !docData.participants.includes(userId))){
             return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await docRef.delete();

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting document:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
}