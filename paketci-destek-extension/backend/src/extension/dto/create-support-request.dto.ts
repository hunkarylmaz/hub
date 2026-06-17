import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  ValidateNested
} from 'class-validator';

/**
 * GÜVENLİK NOTU: Bu kategori listesi chrome-extension/src/constants.js
 * içindeki ISSUE_TYPES.value alanlarıyla AYNI tutulmalıdır. İstemci
 * tarafı kontrolü güvenlik garantisi değildir — sunucu burada otoriter
 * doğrulamayı yapar.
 */
const ALLOWED_CATEGORIES = [
  'courier_not_arrived',
  'package_ready_waiting_courier',
  'courier_wrong_package',
  'courier_marked_delivered_issue',
  'customer_unreachable',
  'address_problem',
  'payment_problem',
  'cancel_refund_problem',
  'restaurant_preparation_problem',
  'technical_problem',
  'other'
] as const;

const ALLOWED_PRIORITIES = ['low', 'normal', 'high', 'urgent', 'critical'] as const;

export class SenderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;
}

export class PackageDto {
  @IsOptional() @IsString() @MaxLength(120) paketciPackageId?: string | null;
  @IsOptional() @IsString() @MaxLength(120) orderNumber?: string | null;
  @IsOptional() @IsString() @MaxLength(200) restaurantName?: string | null;
  @IsOptional() @IsString() @MaxLength(200) branchName?: string | null;
  @IsOptional() @IsString() @MaxLength(120) courierName?: string | null;
  @IsOptional() @IsString() @MaxLength(80) packageStatus?: string | null;
  @IsOptional() @IsString() @MaxLength(80) deliveryStatus?: string | null;
  @IsOptional() @IsString() @MaxLength(80) paymentType?: string | null;
  @IsOptional() @IsString() @MaxLength(40) packageTotal?: string | null;
  @IsOptional() @IsString() @MaxLength(120) customerNameMasked?: string | null;
  @IsOptional() @IsString() @MaxLength(60) customerPhoneMasked?: string | null;
  @IsOptional() @IsString() @MaxLength(160) customerAddressMasked?: string | null;
  @IsOptional() @IsString() @MaxLength(80) packageCreatedAt?: string | null;
  @IsOptional() @IsString() @MaxLength(500) paketciDetailUrl?: string | null;
}

export class TicketDto {
  @IsIn(ALLOWED_CATEGORIES)
  category!: (typeof ALLOWED_CATEGORIES)[number];

  @IsIn(ALLOWED_PRIORITIES)
  priority!: (typeof ALLOWED_PRIORITIES)[number];

  @IsString()
  @Length(5, 120)
  title!: string;

  @IsString()
  @Length(10, 4000)
  description!: string;
}

export class PageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string | null;
}

export class CreateSupportRequestDto {
  @IsIn(['chrome_extension'])
  source!: 'chrome_extension';

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  extensionVersion!: string;

  @ValidateNested()
  @Type(() => SenderDto)
  sender!: SenderDto;

  @ValidateNested()
  @Type(() => PackageDto)
  package!: PackageDto;

  @ValidateNested()
  @Type(() => TicketDto)
  ticket!: TicketDto;

  @ValidateNested()
  @Type(() => PageDto)
  page!: PageDto;
}
