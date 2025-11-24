import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use a strong secret from environment variables

class CustomerAuthService {
    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    generateToken(customerId: string): string {
        return jwt.sign({ customerId }, JWT_SECRET, { expiresIn: '1h' });
    }

    async registerCustomer(email?: string, phone_number?: string, password?: string): Promise<any> {
        if (!email && !phone_number) {
            throw new Error('Either email or phone number is required for registration.');
        }
        if (!password) {
            throw new Error('Password is required for registration.');
        }

        // Check if email or phone_number already exists
        if (email) {
            const existingCustomer = await prisma.customer.findUnique({ where: { email } });
            if (existingCustomer) {
                throw new Error('Customer with this email already exists.');
            }
        }
        if (phone_number) {
            const existingCustomer = await prisma.customer.findUnique({ where: { phone_number } });
            if (existingCustomer) {
                throw new Error('Customer with this phone number already exists.');
            }
        }

        const password_hash = await this.hashPassword(password);

        const customer = await prisma.customer.create({
            data: {
                email,
                phone_number,
                password_hash,
            },
        });

        return customer;
    }

    async loginCustomer(emailOrPhone: string, password_input: string): Promise<{ customer: any, token: string }> {
        let customer;

        // Try to find customer by email
        customer = await prisma.customer.findUnique({ where: { email: emailOrPhone } });

        // If not found by email, try by phone number
        if (!customer) {
            customer = await prisma.customer.findUnique({ where: { phone_number: emailOrPhone } });
        }

        if (!customer) {
            throw new Error('Invalid credentials: Customer not found.');
        }

        const isMatch = await this.comparePassword(password_input, customer.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials: Password mismatch.');
        }

        const token = this.generateToken(customer.id);

        return { customer, token };
    }

    async getCustomerById(customerId: string): Promise<any> {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: {
                id: true,
                email: true,
                phone_number: true,
                rewards_points: true,
                createdAt: true,
            },
        });
        if (!customer) {
            throw new Error('Customer not found.');
        }
        return customer;
    }
}

export const customerAuthService = new CustomerAuthService();
