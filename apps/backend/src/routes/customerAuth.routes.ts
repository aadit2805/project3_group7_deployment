import { Router } from 'express';
import { customerAuthController } from '../controllers/customerAuthController';
import { authenticateCustomer } from '../middleware/customerAuth'; // Import the customer authentication middleware

const router = Router();

router.post('/register', customerAuthController.register);
router.post('/login', customerAuthController.login);
router.get('/me', authenticateCustomer, customerAuthController.getMe); // New route to get authenticated customer's details

export default router;
