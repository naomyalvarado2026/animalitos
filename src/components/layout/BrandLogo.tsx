import { assetUrl } from '@/lib/assets';

/** Original horizontal lockups, with proportional sizing and clear space. */
export function BrandLogo() {
  return <>
    <img src={assetUrl('/brand/logo-color.webp')} alt="AdoptaME" className="brand-logo brand-logo-color" width={156} height={37} />
    <img src={assetUrl('/brand/logo-negative.webp')} alt="AdoptaME" className="brand-logo brand-logo-negative" width={156} height={37} />
  </>;
}
