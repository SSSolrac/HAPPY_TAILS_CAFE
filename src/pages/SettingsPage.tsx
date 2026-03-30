import { useState } from 'react';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const [cafeName, setCafeName] = useState('Staffowner Cafe');
  const [hours, setHours] = useState('07:00 - 21:00');
  const [contact, setContact] = useState('+63 2 8123 4455');
  const [email, setEmail] = useState('ops@staffownercafe.ph');
  const [address, setAddress] = useState('123 Ortigas Ave, Pasig City, Metro Manila');
  const [logoUrl, setLogoUrl] = useState('');
  const [enableCash, setEnableCash] = useState(true);
  const [enableWallet, setEnableWallet] = useState(true);
  const [dineIn, setDineIn] = useState(true);
  const [takeAway, setTakeAway] = useState(true);
  const [delivery, setDelivery] = useState(false);
  const [deliveryRadius, setDeliveryRadius] = useState(4);
  const [serviceFeePct, setServiceFeePct] = useState(5);
  const [taxPct, setTaxPct] = useState(12);
  const [kitchenCutoff, setKitchenCutoff] = useState('20:30');

  return (
    <div className="space-y-4 max-w-4xl">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h2 className="text-xl font-semibold">Business Settings</h2>
        <p className="text-sm text-[#6B7280]">Configure cafe operations and owner-level controls.</p>

        <label className="block text-sm">Cafe Name<input className="block border rounded mt-1 px-2 py-1 w-full" value={cafeName} onChange={(e) => setCafeName(e.target.value)} /></label>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="block text-sm">Business Hours<input className="block border rounded mt-1 px-2 py-1 w-full" value={hours} onChange={(e) => setHours(e.target.value)} /></label>
          <label className="block text-sm">Contact Number<input className="block border rounded mt-1 px-2 py-1 w-full" value={contact} onChange={(e) => setContact(e.target.value)} /></label>
          <label className="block text-sm">Business Email<input className="block border rounded mt-1 px-2 py-1 w-full" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block text-sm">Cafe Address<input className="block border rounded mt-1 px-2 py-1 w-full" value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          <label className="block text-sm md:col-span-2">Logo URL / Branding asset<input className="block border rounded mt-1 px-2 py-1 w-full" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} /></label>
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h3 className="font-medium">Payment & Service Rules</h3>
        <div className="flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={enableCash} onChange={(e) => setEnableCash(e.target.checked)} /> Cash</label><label><input type="checkbox" checked={enableWallet} onChange={(e) => setEnableWallet(e.target.checked)} /> Maya / GCash (E-Wallet)</label></div>
        <div className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Service Fee (%)<input type="number" min={0} className="block border rounded mt-1 px-2 py-1 w-full" value={serviceFeePct} onChange={(e) => setServiceFeePct(Number(e.target.value))} /></label>
          <label className="text-sm">Tax (%)<input type="number" min={0} className="block border rounded mt-1 px-2 py-1 w-full" value={taxPct} onChange={(e) => setTaxPct(Number(e.target.value))} /></label>
          <label className="text-sm">Kitchen cut-off time<input type="time" className="block border rounded mt-1 px-2 py-1 w-full" value={kitchenCutoff} onChange={(e) => setKitchenCutoff(e.target.value)} /></label>
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h3 className="font-medium">Order Types & Delivery</h3>
        <div className="flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={dineIn} onChange={(e) => setDineIn(e.target.checked)} /> Dine-in</label><label><input type="checkbox" checked={takeAway} onChange={(e) => setTakeAway(e.target.checked)} /> Takeaway</label><label><input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} /> Delivery</label></div>
        <label className="text-sm block max-w-xs">Delivery radius (km)<input type="number" min={0} className="block border rounded mt-1 px-2 py-1 w-full" value={deliveryRadius} onChange={(e) => setDeliveryRadius(Number(e.target.value))} disabled={!delivery} /></label>
      </section>

      <button className="rounded bg-[#FFB6C1] text-[#1F2937] px-3 py-2" onClick={() => toast.success('Business settings saved for this session.')}>Save business settings</button>
    </div>
  );
};
