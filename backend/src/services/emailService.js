import nodemailer from 'nodemailer';

const getTransporter = () => {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';

  // For Gmail, using smtp.gmail.com with SSL and family: 4 forces IPv4 to avoid ENETUNREACH on cloud platforms
  if (host.includes('gmail')) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4,
      auth: { user: user.trim(), pass: pass.trim().replace(/\s+/g, '') },
      connectionTimeout: 4000,
      greetingTimeout: 3000,
      socketTimeout: 4000
    });
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    family: 4,
    auth: { user: user.trim(), pass: pass.trim().replace(/\s+/g, '') },
    connectionTimeout: 4000,
    greetingTimeout: 3000,
    socketTimeout: 4000
  });
};

// Send email using Resend HTTPS API (bypasses Render's blocked SMTP ports 465/587)
export const sendViaResend = async (toEmail, subject, html, text) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || 'NABH Wear <onboarding@resend.dev>';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject,
      html,
      text
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Resend email failed');
  }
  return data;
};

export const sendOTPEmail = async (toEmail, otp, purpose = 'login') => {
  const isLogin = purpose === 'login';
  const subject = isLogin
    ? `${otp} is your NABH Wear Sign In Code`
    : `${otp} is your NABH Wear Verification Code`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #F9F9FB; margin: 0; padding: 0; }
          .container { max-width: 560px; margin: 40px auto; background-color: #0D0D0E; border: 1px solid #1C1C1E; padding: 40px 30px; text-align: center; }
          .brand { font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #F9F9FB; margin-bottom: 6px; }
          .tagline { font-size: 10px; font-family: monospace; letter-spacing: 3px; color: #8E8E93; text-transform: uppercase; margin-bottom: 30px; }
          .divider { border-top: 1px solid #1C1C1E; margin: 24px 0; }
          .headline { font-size: 16px; font-weight: 600; color: #F9F9FB; margin-bottom: 12px; }
          .description { font-size: 13px; color: #A1A1AA; line-height: 1.6; margin-bottom: 28px; }
          .otp-box { background-color: #141416; border: 1px solid #2C2C2E; padding: 20px; font-size: 32px; font-weight: 800; letter-spacing: 8px; font-family: monospace; color: #FFFFFF; display: inline-block; margin-bottom: 24px; border-radius: 4px; }
          .validity { font-size: 11px; font-family: monospace; color: #EAB308; text-transform: uppercase; margin-bottom: 24px; }
          .footer { font-size: 11px; color: #555555; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">NABH WEAR</div>
          <div class="tagline">Wear Your Identity</div>
          <div class="divider"></div>
          <div class="headline">${isLogin ? 'Sign In Verification' : 'Email Verification'}</div>
          <div class="description">
            ${isLogin
              ? 'Enter the 6-digit one-time password (OTP) below to sign in to your NABH Wear account.'
              : 'Enter the 6-digit one-time password (OTP) below to verify your email address and activate your member account.'}
          </div>
          <div class="otp-box">${otp}</div>
          <div class="validity">&#x23F1; Valid for 10 minutes only</div>
          <div class="divider"></div>
          <div class="footer">
            If you did not request this verification code, please disregard this message or secure your account.<br/>
            &copy; ${new Date().getFullYear()} NABH Wear. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  console.log('\n==================================================');
  console.log(`[EMAIL OTP SERVICE]`);
  console.log(`Recipient: ${toEmail}`);
  console.log(`Purpose  : ${purpose.toUpperCase()}`);
  console.log(`OTP Code : ${otp}`);
  console.log('==================================================\n');

  try {
    // 1. Try Resend HTTPS API if configured (never blocked by Render)
    if (process.env.RESEND_API_KEY) {
      try {
        const resendData = await sendViaResend(
          toEmail,
          subject,
          html,
          `Your NABH Wear OTP is: ${otp}. It expires in 10 minutes.`
        );
        if (resendData) {
          console.log(`[EMAIL OTP SERVICE] Live email delivered via Resend API to ${toEmail}. Message ID: ${resendData.id}`);
          return { success: true, emailSent: true, messageId: resendData.id };
        }
      } catch (resendErr) {
        console.error(`[EMAIL OTP SERVICE] Resend delivery error: ${resendErr.message}`);
      }
    }

    // 2. Try SMTP Transporter
    const transporter = getTransporter();
    if (transporter) {
      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;
      const info = await transporter.sendMail({
        from: `"NABH WEAR" <${fromAddress}>`,
        to: toEmail,
        subject,
        html,
        text: `Your NABH Wear OTP is: ${otp}. It expires in 10 minutes.`
      });
      console.log(`[EMAIL OTP SERVICE] Live email sent to ${toEmail}. Message ID: ${info.messageId}`);
      return { success: true, emailSent: true, messageId: info.messageId };
    } else {
      console.log(`[EMAIL OTP SERVICE] Note: SMTP credentials not set in .env. OTP printed to server console for testing.`);
      return { success: true, emailSent: false, note: 'SMTP credentials not configured, printed to console' };
    }
  } catch (err) {
    console.error(`[EMAIL OTP SERVICE] Error sending email: ${err.message}`);
    return { success: true, emailSent: false, error: err.message };
  }
};

/**
 * Send an Abandoned Cart reminder email
 */
export const sendAbandonedCartEmail = async (toEmail, customerName, items, totalAmount, checkoutUrl) => {
  const subject = `Your NABH streetwear pieces are waiting in your bag`;
  const nameDisplay = customerName ? customerName.split(' ')[0] : 'there';

  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #1C1C1E;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${item.image ? `<td style="width: 60px; vertical-align: middle;"><img src="${item.image.startsWith('http') ? item.image : process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}${item.image}` : item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 2px; border: 1px solid #2C2C2E;" /></td>` : ''}
            <td style="vertical-align: middle; padding-left: 10px;">
              <div style="font-weight: 700; font-size: 13px; color: #FFFFFF; text-transform: uppercase;">${item.name}</div>
              <div style="font-size: 11px; font-family: monospace; color: #8E8E93; margin-top: 2px;">Color: ${item.color || 'Standard'} &bull; Size: ${item.size || 'M'} &bull; Qty: ${item.quantity}</div>
            </td>
            <td style="text-align: right; vertical-align: middle; font-weight: 700; font-size: 13px; color: #FFFFFF; font-family: monospace;">
              &#8377;${item.price * item.quantity}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #F9F9FB; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 40px auto; background-color: #0D0D0E; border: 1px solid #1C1C1E; padding: 40px 30px; }
          .brand { font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #F9F9FB; margin-bottom: 6px; text-align: center; }
          .tagline { font-size: 10px; font-family: monospace; letter-spacing: 3px; color: #8E8E93; text-transform: uppercase; margin-bottom: 24px; text-align: center; }
          .divider { border-top: 1px solid #1C1C1E; margin: 24px 0; }
          .headline { font-size: 18px; font-weight: 700; color: #F9F9FB; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
          .description { font-size: 13px; color: #A1A1AA; line-height: 1.6; margin-bottom: 24px; }
          .cta-btn { display: inline-block; background-color: #F9F9FB; color: #0A0A0A !important; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; padding: 14px 32px; text-decoration: none; border-radius: 2px; margin: 20px 0; }
          .footer { font-size: 11px; color: #555555; line-height: 1.6; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">NABH WEAR</div>
          <div class="tagline">Wear Your Identity</div>
          <div class="divider"></div>
          <div class="headline">Hey ${nameDisplay}, did you leave this behind?</div>
          <div class="description">
            Your reserved streetwear pieces are still saved in your bag. Our drop inventory is strictly limited, so secure your size before stock runs out.
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${itemsHtml}
            <tr>
              <td style="padding-top: 16px; text-align: right; font-size: 14px; font-weight: 800; color: #FFFFFF; font-family: monospace;">
                Bag Total: &#8377;${totalAmount}
              </td>
            </tr>
          </table>

          <div style="text-align: center;">
            <a href="${checkoutUrl}" class="cta-btn">Complete Your Order &rarr;</a>
          </div>

          <div class="divider"></div>
          <div class="footer">
            240 GSM Heavy-weight &bull; Free Shipping Nationwide &bull; Drop Shoulder Fit<br/>
            &copy; ${new Date().getFullYear()} NABH Wear. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  console.log('\n==================================================');
  console.log(`[ABANDONED CART RECOVERY SERVICE]`);
  console.log(`Recipient: ${toEmail}`);
  console.log(`Customer : ${customerName}`);
  console.log(`Items    : ${items.length} items (Total: Rs. ${totalAmount})`);
  console.log(`Link     : ${checkoutUrl}`);
  console.log('==================================================\n');

  try {
    const transporter = getTransporter();
    if (transporter) {
      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;
      const info = await transporter.sendMail({
        from: `"NABH WEAR" <${fromAddress}>`,
        to: toEmail,
        subject,
        html,
        text: `Hey ${nameDisplay}, your NABH streetwear items (Total: Rs. ${totalAmount}) are waiting in your bag. Complete your order here: ${checkoutUrl}`
      });
      return { success: true, emailSent: true, messageId: info.messageId };
    } else {
      console.log(`[ABANDONED CART SERVICE] SMTP not configured. Notification logged.`);
      return { success: true, emailSent: false, note: 'SMTP not configured, logged to console' };
    }
  } catch (err) {
    console.error(`[ABANDONED CART SERVICE] Error: ${err.message}`);
    return { success: false, error: err.message };
  }
};

/**
 * Send an Order Confirmation Email with detailed invoice breakdown
 */
export const sendOrderConfirmationEmail = async (order) => {
  if (!order || !order.customer?.email) {
    console.warn('[ORDER CONFIRMATION EMAIL] Skipping email: No recipient email provided.');
    return { success: false, message: 'No recipient email' };
  }

  const toEmail = order.customer.email.trim();
  const customerName = order.customer.name || 'Valued Customer';
  const firstName = customerName.split(' ')[0];
  const orderNumber = order.orderNumber;
  const isPaid = order.paymentStatus === 'PAID';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const trackingUrl = `${frontendUrl}/track?order=${orderNumber}`;

  // Indian GST Calculation: 5% Apparel GST
  const taxableAmount = (order.totalAmount / 1.05).toFixed(2);
  const totalTax = (order.totalAmount - taxableAmount).toFixed(2);
  const isInterState = order.shippingAddress?.state?.toLowerCase().trim() !== 'west bengal';
  const taxBreakdownHtml = !isInterState
    ? `<tr><td style="color: #8E8E93; padding: 4px 0;">CGST (2.5%):</td><td style="text-align: right; color: #FFFFFF; font-family: monospace;">&#8377;${(totalTax / 2).toFixed(2)}</td></tr>
       <tr><td style="color: #8E8E93; padding: 4px 0;">SGST (2.5%):</td><td style="text-align: right; color: #FFFFFF; font-family: monospace;">&#8377;${(totalTax / 2).toFixed(2)}</td></tr>`
    : `<tr><td style="color: #8E8E93; padding: 4px 0;">IGST (5%):</td><td style="text-align: right; color: #FFFFFF; font-family: monospace;">&#8377;${totalTax}</td></tr>`;

  const itemsHtml = (order.items || []).map((item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #1C1C1E;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top;">
              <div style="font-weight: 700; font-size: 13px; color: #FFFFFF; text-transform: uppercase;">${item.name}</div>
              <div style="font-size: 11px; font-family: monospace; color: #8E8E93; margin-top: 3px;">
                Color: ${item.color || 'Standard'} &bull; Size: ${item.size || 'M'} &bull; Qty: ${item.quantity}
              </div>
              <div style="font-size: 10px; font-family: monospace; color: #555555; margin-top: 2px;">
                SKU: ${item.sku || 'N/A'}
              </div>
            </td>
            <td style="text-align: right; vertical-align: top; font-weight: 700; font-size: 13px; color: #FFFFFF; font-family: monospace;">
              &#8377;${item.price * item.quantity}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #F9F9FB; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background-color: #0D0D0E; border: 1px solid #1C1C1E; padding: 40px 30px; }
          .brand { font-size: 26px; font-weight: 900; letter-spacing: 5px; color: #FFFFFF; text-align: center; margin-bottom: 4px; }
          .tagline { font-size: 10px; font-family: monospace; letter-spacing: 3px; color: #8E8E93; text-transform: uppercase; text-align: center; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 6px 14px; font-size: 11px; font-family: monospace; text-transform: uppercase; font-weight: 700; border-radius: 2px; }
          .badge-paid { background-color: #052e16; color: #4ade80; border: 1px solid #166534; }
          .badge-cod { background-color: #451a03; color: #fb923c; border: 1px solid #9a3412; }
          .divider { border-top: 1px solid #1C1C1E; margin: 24px 0; }
          .info-table td { padding: 4px 0; font-size: 12px; }
          .cta-btn { display: inline-block; background-color: #FFFFFF; color: #000000 !important; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; padding: 14px 28px; text-decoration: none; border-radius: 2px; margin: 20px 0; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">NABH WEAR</div>
          <div class="tagline">Wear Your Identity</div>
          <div style="text-align: center; margin-bottom: 24px;">
            <span class="badge ${isPaid ? 'badge-paid' : 'badge-cod'}">
              ${isPaid ? '&#10003; Payment Confirmed &bull; Order Booked' : 'Order Placed &bull; Cash on Delivery'}
            </span>
          </div>

          <div style="font-size: 18px; font-weight: 800; color: #FFFFFF; text-transform: uppercase; margin-bottom: 8px;">
            Thank you for your order, ${firstName}!
          </div>
          <div style="font-size: 13px; color: #A1A1AA; line-height: 1.6; margin-bottom: 24px;">
            Your order <strong>#${orderNumber}</strong> has been received and queued for priority printing and fulfillment.
          </div>

          <table style="width: 100%; border-collapse: collapse; background-color: #050505; border: 1px solid #1C1C1E; padding: 16px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 12px; vertical-align: top; width: 50%;">
                <div style="font-size: 10px; font-family: monospace; text-transform: uppercase; color: #8E8E93;">Order Details</div>
                <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; margin-top: 4px;">#${orderNumber}</div>
                <div style="font-size: 11px; color: #8E8E93; margin-top: 2px;">Placed on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div style="font-size: 11px; color: #8E8E93;">Gateway: ${order.paymentGateway || 'RAZORPAY'}</div>
              </td>
              <td style="padding: 12px; vertical-align: top; width: 50%;">
                <div style="font-size: 10px; font-family: monospace; text-transform: uppercase; color: #8E8E93;">Shipping Address</div>
                <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; margin-top: 4px;">${customerName}</div>
                <div style="font-size: 11px; color: #A1A1AA; margin-top: 2px; line-height: 1.4;">
                  ${order.shippingAddress?.streetAddress || ''}<br/>
                  ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}<br/>
                  Phone: ${order.customer?.phone || ''}
                </div>
              </td>
            </tr>
          </table>

          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #FFFFFF; margin-bottom: 12px;">
            Ordered Items
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            ${itemsHtml}
          </table>

          <!-- Financial Breakdown -->
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
            <tr>
              <td style="color: #8E8E93; padding: 4px 0;">Taxable Value:</td>
              <td style="text-align: right; color: #FFFFFF; font-family: monospace;">&#8377;${taxableAmount}</td>
            </tr>
            ${taxBreakdownHtml}
            <tr>
              <td style="color: #8E8E93; padding: 4px 0;">Shipping Fee:</td>
              <td style="text-align: right; color: #4ade80; font-family: monospace; font-weight: 700;">FREE</td>
            </tr>
            <tr style="border-top: 1px solid #1C1C1E;">
              <td style="padding: 10px 0; font-weight: 800; font-size: 14px; color: #FFFFFF;">Total ${isPaid ? 'Paid' : 'Due'}:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 800; font-size: 16px; color: #FFFFFF; font-family: monospace;">
                &#8377;${order.totalAmount}
              </td>
            </tr>
          </table>

          <div style="text-align: center;">
            <a href="${trackingUrl}" class="cta-btn">Track Order Live &rarr;</a>
          </div>

          <div class="divider"></div>
          <div style="font-size: 11px; color: #555555; line-height: 1.6; text-align: center;">
            Need help with your order? Reach our customer helpline at +91 8240 966477 or email mondalpartha6561@gmail.com.<br/>
            &copy; ${new Date().getFullYear()} NABH Wear. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  console.log(`[ORDER CONFIRMATION SERVICE] Sending invoice email for order ${orderNumber} to ${toEmail}...`);

  try {
    const transporter = getTransporter();
    if (transporter) {
      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;
      const info = await transporter.sendMail({
        from: `"NABH WEAR" <${fromAddress}>`,
        to: toEmail,
        subject: `Order Confirmed: #${orderNumber} (${isPaid ? 'Payment Received' : 'Cash on Delivery'})`,
        html,
        text: `Hi ${firstName}, your NABH Wear order #${orderNumber} of Rs. ${order.totalAmount} is confirmed! Track your shipment live at: ${trackingUrl}`
      });
      console.log(`[ORDER CONFIRMATION SERVICE] Live email sent to ${toEmail}. Message ID: ${info.messageId}`);
      return { success: true, emailSent: true, messageId: info.messageId };
    } else {
      console.log(`[ORDER CONFIRMATION SERVICE] SMTP credentials not set in .env. Logged to console.`);
      return { success: true, emailSent: false, note: 'SMTP not configured' };
    }
  } catch (err) {
    console.error(`[ORDER CONFIRMATION SERVICE] Error sending confirmation: ${err.message}`);
    return { success: false, error: err.message };
  }
};


