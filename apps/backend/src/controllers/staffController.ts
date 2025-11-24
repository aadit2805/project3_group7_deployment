import { Request, Response, NextFunction } from 'express';
import { getLocalStaff, updateLocalStaff, updateLocalStaffPassword, createLocalStaff, authenticateStaff } from '../services/staffService'; // Import authenticateStaff
import passport from 'passport'; // Import passport

export const getAuthenticatedUserController = (req: Request, res: Response) => {
  if (req.user) {
    // Ensure that sensitive information like password_hash is not sent to the frontend
    const user = req.user as any; // Cast to any to access properties
    const { password_hash, ...userWithoutHash } = user;
    res.status(200).json(userWithoutHash);
  } else {
    res.status(404).json({ message: 'User not found in session' });
  }
};

export const staffLoginController = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      console.error('Passport authentication error:', err);
      return res.status(500).json({ message: 'Internal server error during authentication' });
    }
    if (!user) {
      return res.status(401).json({ message: info.message || 'Authentication failed' });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Error logging in user:', loginErr);
        return res.status(500).json({ message: 'Could not log in user' });
      }
      // Attach a 'type' property to distinguish local staff when logging in
      (user as any).type = 'local';
      // If login is successful, send user data
      res.status(200).json({ message: 'Login successful', user: { staff_id: user.staff_id, username: user.username, role: user.role, type: user.type } });
    });
  })(req, res, next);
};

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
