import bdoQr from '@/assets/payments/BDO.svg';
import gcashQr from '@/assets/payments/GCASH.svg';
import maribankQr from '@/assets/payments/MARIBANK.svg';
import qrphQr from '@/assets/payments/QRPH.svg';
import type { PaymentMethod } from '@/types/order';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  qrph: 'QRPH',
  gcash: 'GCash',
  maribank: 'MariBank',
  bdo: 'BDO',
};

const PAYMENT_METHOD_QR_ASSETS: Record<PaymentMethod, string> = {
  qrph: qrphQr,
  gcash: gcashQr,
  maribank: maribankQr,
  bdo: bdoQr,
};

const METHOD_ALIASES: Record<string, PaymentMethod> = {
  qrph: 'qrph',
  gcash: 'gcash',
  maribank: 'maribank',
  bdo: 'bdo',
  e_wallet: 'gcash',
  ewallet: 'gcash',
  maya: 'gcash',
  card: 'bdo',
  cash: 'qrph',
};

export const normalizePaymentMethod = (method: string | undefined | null): PaymentMethod => {
  const normalized = (method ?? 'qrph').toLowerCase().replaceAll('-', '_').trim();
  return METHOD_ALIASES[normalized] ?? 'qrph';
};

export const paymentMethodToLabel = (method: PaymentMethod) => PAYMENT_METHOD_LABELS[method];

export const labelToPaymentMethod = (label: string): PaymentMethod => normalizePaymentMethod(label);

export const getPaymentQrAsset = (method: PaymentMethod) => PAYMENT_METHOD_QR_ASSETS[method];
