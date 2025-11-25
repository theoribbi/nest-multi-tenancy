import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    email!: string;

    @ApiProperty({ required: false, nullable: true })
    firstName?: string | null;

    @ApiProperty({ required: false, nullable: true })
    lastName?: string | null;

    @ApiProperty()
    createdAt!: Date;
}

export class CreateUserDto {
    @ApiProperty()
    email!: string;

    @ApiProperty({ required: true })
    firstName!: string;

    @ApiProperty({ required: true })
    lastName!: string;
}