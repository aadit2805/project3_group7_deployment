import { Request, Response } from 'express';
import { customerAuthService } from '../services/customerAuthService';

export const customerAuthController = {
    async register(req: Request, res: Response) {
        const { email, phone_number, password } = req.body;

        try {
            const customer = await customerAuthService.registerCustomer(email, phone_number, password);
            const token = customerAuthService.generateToken(customer.id);
            res.status(201).json({ message: 'Customer registered successfully', customer: { id: customer.id, email: customer.email, phone_number: customer.phone_number }, token });
        } catch (error: any) {
            if (error.message.includes('already exists')) {
                return res.status(409).json({ message: error.message });
            }
            res.status(400).json({ message: error.message });
        }
    },

    async login(req: Request, res: Response) {
        const { emailOrPhone, password } = req.body;

        try {
            const { customer, token } = await customerAuthService.loginCustomer(emailOrPhone, password);
            res.status(200).json({ message: 'Login successful', customer: { id: customer.id, email: customer.email, phone_number: customer.phone_number }, token });
        } catch (error: any) {
            res.status(401).json({ message: error.message });
        }
    },

    async getMe(req: Request, res: Response) {
        // req.customer is set by the authenticateCustomer middleware
        const customerId = req.customer?.id;

        if (!customerId) {
            return res.status(401).json({ message: 'Not authenticated as a customer.' });
        }

        try {
            const customer = await customerAuthService.getCustomerById(customerId);
            res.status(200).json({ success: true, customer });
        } catch (error: any) {
            res.status(404).json({ message: error.message });
        }
    }
};
