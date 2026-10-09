import React from 'react';
import { FileText, Printer, X } from 'lucide-react';

const InvoiceModal = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  // Indian GST Calculation: 5% Apparel GST (2.5% CGST + 2.5% SGST or 5% IGST)
  const isInterState = order.shippingAddress?.state?.toLowerCase().trim() !== 'west bengal';
  const taxableAmount = (order.totalAmount / 1.05).toFixed(2);
  const totalTax = (order.totalAmount - taxableAmount).toFixed(2);
  const cgst = !isInterState ? (totalTax / 2).toFixed(2) : '0.00';
  const sgst = !isInterState ? (totalTax / 2).toFixed(2) : '0.00';
  const igst = isInterState ? totalTax : '0.00';

  const invoiceNumber = `INV-${order.orderNumber}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D0D10] border border-[#2C2C2E] max-w-3xl w-full max-h-[95vh] flex flex-col shadow-2xl rounded-sm">
        {/* Modal Top Actions */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#1C1C1E] bg-[#111114]">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-zinc-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              GST Tax Invoice &bull; {order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white text-black px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider hover:bg-zinc-200 transition"
            >
              <Printer size={13} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-[#8E8E93] hover:text-white p-1 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div id="printable-invoice" className="p-8 overflow-y-auto space-y-6 text-[#1C1C1E] bg-white text-xs">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-zinc-300 pb-4">
            <div>
              <h1 className="text-2xl font-black tracking-wider text-black font-sans uppercase">
                NABH WEAR
              </h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                Wear Your Identity &bull; Heavy-weight Streetwear
              </p>
              <div className="mt-2 text-[11px] text-zinc-600 leading-tight">
                <p className="font-bold text-black">NABH WEAR APPAREL</p>
                <p>Proprietor: Partha Protim Mondal</p>
                <p>Kolkata, West Bengal, India - 700001</p>
                <p>GSTIN: <span className="font-mono font-bold text-black">19AAACN8472P1ZV</span></p>
                <p>Support: <span className="font-mono">mondalpartha6561@gmail.com</span></p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block bg-black text-white px-2.5 py-1 text-[10px] font-bold uppercase font-mono tracking-widest">
                TAX INVOICE
              </span>
              <p className="text-xs font-mono font-bold text-black mt-2">
                Invoice No: {invoiceNumber}
              </p>
              <p className="text-[11px] text-zinc-600 font-mono">Date: {invoiceDate}</p>
              <p className="text-[11px] text-zinc-600 font-mono">
                Payment: <span className="font-bold text-black uppercase">{order.paymentGateway || 'RAZORPAY'} ({order.paymentStatus || 'PAID'})</span>
              </p>
              {order.trackingNumber && (
                <p className="text-[10px] font-mono text-zinc-500">AWB/Tracking: {order.trackingNumber}</p>
              )}
            </div>
          </div>

          {/* Bill To & Ship To */}
          <div className="grid grid-cols-2 gap-6 border-b border-zinc-300 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                Billed To:
              </p>
              <p className="font-bold text-sm text-black">{order.customer?.name}</p>
              <p className="text-zinc-600">{order.customer?.email}</p>
              <p className="text-zinc-600 font-mono">Phone: +91 {order.customer?.phone}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                Shipped To:
              </p>
              <p className="font-bold text-black">{order.shippingAddress?.streetAddress || 'Address on file'}</p>
              <p className="text-zinc-600">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
              <p className="text-zinc-600">India</p>
              <p className="text-zinc-500 text-[10px] font-mono mt-1">Place of Supply: {order.shippingAddress?.state || 'India'}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full border-collapse text-left border border-zinc-300">
              <thead>
                <tr className="bg-zinc-100 font-mono text-[10px] uppercase tracking-wider text-zinc-700 border-b border-zinc-300">
                  <th className="p-2.5 border-r border-zinc-300">#</th>
                  <th className="p-2.5 border-r border-zinc-300">Item Description</th>
                  <th className="p-2.5 border-r border-zinc-300">HSN</th>
                  <th className="p-2.5 border-r border-zinc-300 text-center">Qty</th>
                  <th className="p-2.5 border-r border-zinc-300 text-right">Unit Price</th>
                  <th className="p-2.5 border-r border-zinc-300 text-right">Taxable Val</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-mono text-xs">
                {(order.items || []).map((item, idx) => {
                  const itemTotal = item.price * item.quantity;
                  const itemTaxable = (itemTotal / 1.05).toFixed(2);
                  return (
                    <tr key={idx}>
                      <td className="p-2.5 border-r border-zinc-200 text-center text-zinc-500">{idx + 1}</td>
                      <td className="p-2.5 border-r border-zinc-200 font-sans">
                        <div className="font-bold text-black uppercase">{item.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Color: {item.color} | Size: {item.size} | SKU: {item.sku}
                        </div>
                      </td>
                      <td className="p-2.5 border-r border-zinc-200 text-center text-zinc-600">6109</td>
                      <td className="p-2.5 border-r border-zinc-200 text-center font-bold">{item.quantity}</td>
                      <td className="p-2.5 border-r border-zinc-200 text-right">₹{item.price}</td>
                      <td className="p-2.5 border-r border-zinc-200 text-right text-zinc-600">₹{itemTaxable}</td>
                      <td className="p-2.5 text-right font-bold text-black">₹{itemTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tax Summary & Totals */}
          <div className="grid grid-cols-2 gap-6 items-start pt-2">
            <div className="border border-zinc-200 p-3 bg-zinc-50 text-[11px] font-mono space-y-1">
              <p className="font-bold text-black uppercase text-[10px]">Tax Breakdown (GST 5%):</p>
              {!isInterState ? (
                <>
                  <div className="flex justify-between text-zinc-600">
                    <span>CGST (2.5%):</span>
                    <span>₹{cgst}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>SGST (2.5%):</span>
                    <span>₹{sgst}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-zinc-600">
                  <span>IGST (5.0%):</span>
                  <span>₹{igst}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-black pt-1 border-t border-zinc-200">
                <span>Total Tax:</span>
                <span>₹{totalTax}</span>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-right text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal (Taxable):</span>
                <span>₹{taxableAmount}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Applicable GST (5%):</span>
                <span>₹{totalTax}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Shipping &amp; Handling:</span>
                <span className="text-green-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-black pt-2 border-t border-zinc-300">
                <span>Total Amount:</span>
                <span>₹{order.totalAmount}.00</span>
              </div>
            </div>
          </div>

          {/* Footer Declaration */}
          <div className="border-t border-zinc-300 pt-4 flex justify-between items-end text-[10px] text-zinc-500 font-sans">
            <div>
              <p className="font-bold text-black uppercase">Declaration</p>
              <p className="text-zinc-600 leading-relaxed max-w-sm">
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-black text-xs uppercase mb-1">NABH WEAR</div>
              <div className="inline-block border border-dashed border-zinc-400 px-3 py-1 font-mono text-[9px] text-zinc-400">
                Authorized Signatory &bull; System Generated
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
