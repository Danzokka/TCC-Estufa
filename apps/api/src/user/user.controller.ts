import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { UserService } from './user.service';
import {
  AuthUserDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
} from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() userDto: CreateUserDto) {
    try {
      return this.userService.createUser(userDto);
    } catch (error) {
      throw error;
    }
  }

  @Post('change-password')
  changePassword(@Body() updatePassword: UpdateUserPasswordDto) {
    try {
      return this.userService.updatePassword(updatePassword);
    } catch (error) {
      throw error;
    }
  }

  @Put()
  updateUser(@Body() updateUser: UpdateUserDto) {
    try {
      return this.userService.updateUser(updateUser);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  getUser(@Query('field') field: string, @Query('value') value: string) {
    try {
      if (!field || !value) {
        return this.userService.getAllUsers();
      }
      return this.userService.findUserByField(field, value);
    } catch (error) {
      throw error;
    }
  }
}
