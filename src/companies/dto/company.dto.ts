import { ApiProperty } from '@nestjs/swagger';

export class CompanyDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  schemaName!: string;

  @ApiProperty({ required: false, nullable: true })
  logoUrl?: string | null;

}
