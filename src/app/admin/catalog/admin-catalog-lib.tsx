
import * as z from 'zod';
import { Collection, Rarity, Gift, User } from '@/lib/types';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const IMAGE_WIDTH = 1024;
const IMAGE_HEIGHT = 1024;

export const giftSchema = z.object({
  name: z.array(z.object({ lang: z.string().min(2), value: z.string().min(2) })).min(1, { message: "At least one localized name is required." }),
  collectionId: z.string().min(1, { message: "Please select a collection." }),
  rarityId: z.string().min(1, { message: "Please select a rarity." }),
  image: z.any()
    .refine((file) => file, "Image is required.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
    .refine(
        (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
        ".jpg, .jpeg, .png and .webp files are accepted."
    )
    .refine(async (file) => {
        if (typeof window === 'undefined' || !file) return true;

        return new Promise<boolean>((resolve) => {
            const image = new window.Image();
            image.src = URL.createObjectURL(file);
            image.onload = () => {
                resolve(image.width <= IMAGE_WIDTH && image.height <= IMAGE_HEIGHT);
            };
            image.onerror = () => {
                resolve(false);
            };
        });
  }, `Image must be at most ${IMAGE_WIDTH}x${IMAGE_HEIGHT}px.`),
}).superRefine((data, ctx) => {
  if (data.image && typeof data.image !== 'string') { // Only validate if a new file is uploaded
    if (data.image.size > MAX_FILE_SIZE) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Max file size is 2MB.`, path: ['image'] });
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(data.image.type)) {
         ctx.addIssue({ code: z.ZodIssueCode.custom, message: `.jpg, .jpeg, .png and .webp files are accepted.`, path: ['image'] });
    }
  }
});

export type GiftFormData = z.infer<typeof giftSchema>;

export interface AdminGiftClientProps {
  initialGift: Gift | null;
  initialCollections: Collection[];
  initialRarities: Rarity[];
}
