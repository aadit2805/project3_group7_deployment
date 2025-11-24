import { Request, Response } from 'express';
import { getLocalStaff, updateLocalStaff, updateLocalStaffPassword, createLocalStaff } from '../services/staffService';

export const getLocalStaffController = async (req: Request, res: Response) => {
  try {
    const staff = await getLocalStaff();
    res.status(200).json(staff);
  } catch (error: any) {
    console.error('Error in getLocalStaffController:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateLocalStaffController = async (req: Request, res: Response) => {
  try {
    const staff_id = parseInt(req.params.id, 10);
    const { username, role } = req.body;

    if (isNaN(staff_id)) {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }
    if (!username || !role) {
        return res.status(400).json({ message: 'Username and role are required' });
    }

    const updatedStaff = await updateLocalStaff(staff_id, username, role);
    res.status(200).json(updatedStaff);
  } catch (error: any) {
    console.error('Error in updateLocalStaffController:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const updateLocalStaffPasswordController = async (req: Request, res: Response) => {
  try {
    const staff_id = parseInt(req.params.id, 10);
    const { newPassword } = req.body;

    if (isNaN(staff_id)) {
      return res.status(400).json({ message: 'Invalid staff ID' });
    }
    if (!newPassword) {
        return res.status(400).json({ message: 'New password is required' });
    }

    const updatedStaff = await updateLocalStaffPassword(staff_id, newPassword);
    res.status(200).json(updatedStaff);
  } catch (error: any) {
    console.error('Error in updateLocalStaffPasswordController:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const createLocalStaffController = async (req: Request, res: Response) => {
  try {
    const { username, role, password } = req.body;

    if (!username || !role || !password) {
      return res.status(400).json({ message: 'Username, role, and password are required' });
    }

    const newStaff = await createLocalStaff(username, role, password);
    res.status(201).json(newStaff);
  } catch (error: any) {
    console.error('Error in createLocalStaffController:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
