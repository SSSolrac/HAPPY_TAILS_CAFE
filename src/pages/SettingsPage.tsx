import { useState } from 'react';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const [cafeName, setCafeName] = useState('Staffowner Cafe');
  const [hours, setHours] = useState('07:00 - 21:00');
  const [contact, setContact] = useState('+1 555-0199');
  const [enableCash, setEnableCash] = useState(true);
  const [enableCard, setEnableCard] = useState(true);
  const [enableWallet, setEnableWallet] = useState(true);
  const [dineIn, setDineIn] = useState(true);
  const [takeAway, setTakeAway] = useState(true);
  const [delivery, setDelivery] = useState(false);

  return (
    <div className="space-y-4 max-w-3xl">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h2 className="text-xl font-semibold">Business Settings</h2>
        <p className="text-sm text-slate-500">Configure cafe operations for owner/staff workflows.</p>

        <label className="block text-sm">Cafe Name
          <input className="block border rounded mt-1 px-2 py-1 w-full" value={cafeName} onChange={(e) => setCafeName(e.target.value)} />
        </label>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="block text-sm">Business Hours
            <input className="block border rounded mt-1 px-2 py-1 w-full" value={hours} onChange={(e) => setHours(e.target.value)} />
          </label>
          <label className="block text-sm">Contact
            <input className="block border rounded mt-1 px-2 py-1 w-full" value={contact} onChange={(e) => setContact(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h3 className="font-medium">Payment Methods Enabled</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <label><input type="checkbox" checked={enableCash} onChange={(e) => setEnableCash(e.target.checked)} /> Cash</label>
          <label><input type="checkbox" checked={enableCard} onChange={(e) => setEnableCard(e.target.checked)} /> Card</label>
          <label><input type="checkbox" checked={enableWallet} onChange={(e) => setEnableWallet(e.target.checked)} /> E-Wallet</label>
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h3 className="font-medium">Order Type Toggles</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <label><input type="checkbox" checked={dineIn} onChange={(e) => setDineIn(e.target.checked)} /> Dine-in</label>
          <label><input type="checkbox" checked={takeAway} onChange={(e) => setTakeAway(e.target.checked)} /> Takeaway</label>
          <label><input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} /> Delivery</label>
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-2 text-sm">
        <h3 className="font-medium">Future Settings Placeholders</h3>
        <p>• Loyalty settings placeholder (tier thresholds, stamp rules)</p>
        <p>• Daily menu automation placeholder (publish schedule, fallback rules)</p>
        <p className="text-slate-500">TODO: persist these settings to shared business configuration endpoint.</p>
      </section>

      <button className="rounded bg-indigo-600 text-white px-3 py-2" onClick={() => toast.success('Business settings saved (mock).')}>Save business settings</button>
    </div>
  );
};
