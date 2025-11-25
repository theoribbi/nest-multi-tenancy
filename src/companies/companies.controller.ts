import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { CompaniesService } from '@companies/companies.service';
import type { Company } from '@db/schema/public/companies';
import { ApiOkResponse, ApiNotFoundResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { CompanyDto, CreateCompanyDto } from '@companies/dto/company.dto';

@Controller('companies')
export class CompaniesController {
    constructor(private readonly companiesService: CompaniesService) { }

    @Get()
    @ApiOkResponse({ type: CompanyDto, isArray: true })
    async getAllCompanies(): Promise<Company[]> {
        return this.companiesService.getAllCompanies();
    }

    @Get(':id')
    @ApiOkResponse({ type: CompanyDto })
    @ApiNotFoundResponse()
    async getCompanyById(@Param('id') id: string): Promise<Company | null> {
        return this.companiesService.getCompanyById(id);
    }

    @Get('slug/:slug')
    @ApiOkResponse({ type: CompanyDto })
    @ApiNotFoundResponse()
    async getCompanyBySlug(@Param('slug') slug: string): Promise<Company | null> {
        return this.companiesService.getCompanyBySlug(slug);
    }

    @Post()
    @ApiCreatedResponse({ type: CompanyDto })
    async createCompany(@Body() input: CreateCompanyDto): Promise<CompanyDto> {
        return this.companiesService.createCompany(input);
    }
}
