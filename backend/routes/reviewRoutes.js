import express from 'express';
import { getReviewsByProduct, createReview, updateReview, deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middlewares/auth.js';
import { verifyPurchasedProduct } from '../middlewares/verifyPurchasedProduct.js';

const router = express.Router();


router.get('/:productId', getReviewsByProduct);
router.post('/:productId', protect, verifyPurchasedProduct, createReview);
router.put('/:reviewId', protect, updateReview);

router.delete('/:reviewId', protect, deleteReview);

export default router;
