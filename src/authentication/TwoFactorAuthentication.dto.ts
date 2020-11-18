import { IsString } from 'class-validator';

class TwoFactorAuthenticatorDto {
    @IsString()
    public twoFactorAuthenticationCode: string;
}

export default TwoFactorAuthenticatorDto;