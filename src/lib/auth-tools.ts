
import { NextRequest } from 'next/server';
import { firebaseAdminAuth, firebaseAdminFirestore } from '@/lib/firebase-admin';
import { ADMIN_LEVEL, MANAGER_LEVEL } from './constants';

async function getDataFromToken(request: NextRequest, key: string): Promise<any> {
    const header = request.headers.get('authorization');
    if (!header || !header.startsWith('Bearer ')) {
        return null;
    }
    const idToken = header.split('Bearer ')[1];
    try {
        const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);
        var data: any;
        if ( key == 'uid' ) {
            data = decodedToken.uid;
        } else if ( key == 'roleLevel' ) {   
            data = decodedToken.roleLevel;
        } else if ( key == 'isAdmin' ) {
            data = (decodedToken.roleLevel >= ADMIN_LEVEL);
        } else if ( key == 'isManager' ) {
            data = (decodedToken.roleLevel >= MANAGER_LEVEL);
        } else if ( key == 'isAuth' ) {
            data = true;
        } else {
            data = null;
        }
        return data;
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return null;
    }
}

async function getUserIdFromToken(req: NextRequest): Promise<string | null> {
    return await getDataFromToken(req, 'uid');
}

async function getRoleLevelFromToken(req: NextRequest): Promise<number | null> {
    return await getDataFromToken(req, 'roleLevel');
}

async function userIsAdminFromToken(req: NextRequest): Promise<boolean | null> {
    return await getDataFromToken(req, 'isAdmin');
}

async function userIsManagerFromToken(req: NextRequest): Promise<boolean | null> {
    return await getDataFromToken(req, 'isAdmin');
}

async function userIsAuthenticated(req: NextRequest): Promise<boolean | null> {
    return await getDataFromToken(req, 'isAuth');
}

async function userIsAdmin(uid: string): Promise<boolean> {
    try {
        const userDoc = await firebaseAdminFirestore.collection('users').doc(uid).get();
        return userDoc.exists && (userDoc.data()?.roleLevel < ADMIN_LEVEL);
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}


export { getUserIdFromToken, getRoleLevelFromToken, userIsAdminFromToken, 
        userIsManagerFromToken, userIsAuthenticated, userIsAdmin }