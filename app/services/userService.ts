// src/services/userService.ts
import User from '../models/User';

class UserService {
  static async getAllUsers(): Promise<any[]> {
    // Find all users and exclude the password field
    return User.find().select('-password');
  }

  static async getUserById(id: string): Promise<any> {
    // Find user by ID and exclude the password field
    return User.findById(id).select('-password');
  }

  static async updateUser(id: string, updateData: any): Promise<any> {
    // Don't allow password updates through this method for security
    if (updateData.password) {
      delete updateData.password;
    }
    
    // Update user and return the updated document
    return User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password');
  }

  static async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }
}

export default UserService;