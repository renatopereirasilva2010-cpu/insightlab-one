import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { LegalDocumentType } from '@prisma/client';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequiredPermissions } from '../../common/decorators/required-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AcceptConsentDto } from './dto/accept-consent.dto';
import { CreateDataSubjectRequestDto } from './dto/create-data-subject-request.dto';
import { UpdateDataSubjectRequestDto } from './dto/update-data-subject-request.dto';
import { LegalService } from './legal.service';

function extractClientInfo(req: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipAddress =
    (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : null) ??
    req.socket?.remoteAddress ??
    null;
  const userAgent = req.headers['user-agent'] ?? null;
  return { ipAddress, userAgent: userAgent as string | null };
}

@Controller('v1/legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('documents/current')
  getCurrentDocument(@Query('type') type: LegalDocumentType) {
    return this.legalService.getCurrentDocument(type);
  }

  @Post('data-subject-requests/:tenantSlug')
  createDataSubjectRequest(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreateDataSubjectRequestDto,
  ) {
    return this.legalService.createDataSubjectRequest(tenantSlug, dto);
  }

  @Get('consents/me')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
  getOwnConsentStatus(@CurrentUser() user: { id: string }) {
    return this.legalService.getOwnConsentStatus(user.id);
  }

  @Post('consents')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
  acceptConsent(
    @CurrentTenant() tenant: { id: string },
    @CurrentUser() user: { id: string },
    @Body() dto: AcceptConsentDto,
    @Req() req: Request,
  ) {
    const { ipAddress, userAgent } = extractClientInfo(req);
    return this.legalService.acceptConsent(tenant.id, user.id, dto.type, ipAddress, userAgent);
  }

  @Get('data-subject-requests')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
  @RequiredPermissions('data-subject-requests.read')
  findDataSubjectRequests(@CurrentTenant() tenant: { id: string }) {
    return this.legalService.findDataSubjectRequests(tenant.id);
  }

  @Patch('data-subject-requests/:id')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
  @RequiredPermissions('data-subject-requests.update')
  updateDataSubjectRequest(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateDataSubjectRequestDto,
  ) {
    return this.legalService.updateDataSubjectRequest(tenant.id, id, dto);
  }
}
