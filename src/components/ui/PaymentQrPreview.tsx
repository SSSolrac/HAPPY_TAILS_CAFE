import { getPaymentQrAsset, paymentMethodToLabel } from '@/utils/payment';
import type { PaymentMethod } from '@/types/order';

type PaymentQrPreviewProps = {
  paymentMethod: PaymentMethod;
  className?: string;
};

export const PaymentQrPreview = ({ paymentMethod, className }: PaymentQrPreviewProps) => (
  <div className={className}>
    <p className="font-medium text-sm mb-2">{paymentMethodToLabel(paymentMethod)} QR</p>
    <img
      src={getPaymentQrAsset(paymentMethod)}
      alt={`${paymentMethodToLabel(paymentMethod)} payment QR`}
      className="h-44 w-44 rounded border object-contain bg-white p-2"
    />
  </div>
);
