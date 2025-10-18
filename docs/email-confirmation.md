# Order Confirmation Email

Catchy hien tai su dung EmailJS tren frontend de gui email xac nhan don hang, vi vay ban khong can nang cap Firebase len goi Blaze. Neu muon duy tri backend trigger bang Firebase Functions, hay xem Option 2 ben duoi.

## Option 1: EmailJS (khong can Blaze)

### Cach hoat dong
- Sau khi khach gui form, `order.html` goi EmailJS voi service `service_mro3kzr` va template `template_mov4q4r`.
- EmailJS nhan cac bien: `fullName`, `phone`, `email`, `quantity`, `createdAt`, `orderId` va gui email tu template ban tao tren EmailJS.

### Thiet lap
1. Dang ky tai khoan EmailJS (neu chua co) va tao service + template theo ID tren. Ban co the sao chep ID nay vao Dashboard EmailJS hoac doi lai trong file HTML cho phu hop.
2. Lay `Public Key` tu Dashboard EmailJS (Account > API Keys).
3. Mo `order.html`, tim script `window.CATCHY_EMAILJS_CONFIG` gan cuoi file va dien public key:
   ```html
   <script>
     window.CATCHY_EMAILJS_CONFIG = {
       publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
       serviceId: 'service_mro3kzr',
       templateId: 'template_mov4q4r'
     };
   </script>
   ```
4. Trong EmailJS template, dam bao cac truong trung khop ten bien (vi du `{{fullName}}`, `{{createdAt}}`), muc **Subject** dung `{{title}}`, va **To email** dung mot trong cac bien `{{to_email}}`, `{{email}}` hoac `{{user_email}}` de email gui den khach hang.
5. Test: refresh trang order, gui thu don hang co email hop le. Kiem tra tab EmailJS History hoac hop thu cua khach.

### Tinh chinh noi dung
- Noi dung email nam trong template EmailJS, sua truc tiep tren EmailJS.
- Neu muon them bien moi, cap nhat template EmailJS va bo sung truong trong `templateParams` (ham `sendEmailConfirmation` tren `order.html`).

### Mau template HTML (da kem chu ky & lien ket)
```html
<div style="max-width:620px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#f9f6ff;border-radius:18px;overflow:hidden;box-shadow:0 12px 38px rgba(87,63,255,0.18);color:#1b103f;">
  <div style="background:linear-gradient(135deg,#5f3bff 0%,#9c3df9 60%,#ff7676 100%);padding:28px 32px;color:#fff;">
    <p style="margin:0;font-size:15px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">Catchy Boardgame</p>
    <h1 style="margin:12px 0 0;font-size:28px;font-weight:800;">Xác nhận đơn hàng {{orderId}}</h1>
  </div>

  <div style="padding:28px 32px;">
    <p style="margin:0 0 14px;">Chào <strong>{{fullName}}</strong>,</p>
    <p style="margin:0 0 18px;">Cảm ơn bạn đã đặt mua <strong>Catchy – Boardgame học tiếng Anh</strong>. Đội ngũ Catchy đã nhận được yêu cầu và sẽ liên hệ với bạn sớm nhất.</p>

    <div style="background:#fff;border-radius:14px;border:1px solid #ece4ff;padding:20px;">
      <h3 style="margin:0 0 16px;font-size:18px;color:#5f3bff;text-transform:uppercase;letter-spacing:0.08em;">Thông tin đơn hàng</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          <tr>
            <td style="padding:6px 0;color:#7169a1;width:38%;">Mã đơn:</td>
            <td style="padding:6px 0;font-weight:600;">{{orderId}}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7169a1;">Họ tên:</td>
            <td style="padding:6px 0;font-weight:600;">{{fullName}}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7169a1;">Số điện thoại:</td>
            <td style="padding:6px 0;font-weight:600;">{{phone}}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7169a1;">Email:</td>
            <td style="padding:6px 0;font-weight:600;">{{email}}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7169a1;">Số lượng:</td>
            <td style="padding:6px 0;font-weight:600;">{{quantity}}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7169a1;">Thời gian gửi:</td>
            <td style="padding:6px 0;font-weight:600;">{{createdAt}}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style="margin:22px 0 0;">Nếu bạn cần chỉnh sửa thông tin, hãy trả lời email này hoặc liên hệ trực tiếp với Catchy qua <a href="mailto:catchyboardgame@gmail.com" style="color:#5f3bff;font-weight:600;text-decoration:none;">catchyboardgame@gmail.com</a>.</p>

    <div style="margin:28px 0;text-align:center;">
      <a href="https://catchy-boardgame.vercel.app/" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#5f3bff,#ff7676);color:#fff;font-weight:700;border-radius:999px;text-decoration:none;">Khám phá thêm hoạt động Catchy</a>
    </div>
  </div>

  <div style="background:#ede7ff;padding:22px 32px;">
    <p style="margin:0 0 10px;font-weight:700;color:#4b3cad;text-transform:uppercase;letter-spacing:0.12em;">Catchy Team</p>
    <p style="margin:0 0 12px;color:#5b528d;">Học tiếng Anh vui nhộn – chơi là nhớ!</p>
    <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:14px;">
      <a href="https://catchy-boardgame.vercel.app/" style="color:#5f3bff;text-decoration:none;font-weight:600;">Website</a>
      <span style="color:#938bc2;">•</span>
      <a href="https://www.facebook.com/profile.php?id=61582668590559&sk=grid" style="color:#5f3bff;text-decoration:none;font-weight:600;">Facebook</a>
      <span style="color:#938bc2;">•</span>
      <a href="https://www.tiktok.com/@CatchyGameVN" style="color:#5f3bff;text-decoration:none;font-weight:600;">TikTok</a>
      <span style="color:#938bc2;">•</span>
      <a href="mailto:catchyboardgame@gmail.com" style="color:#5f3bff;text-decoration:none;font-weight:600;">catchyboardgame@gmail.com</a>
    </div>
  </div>
</div>
```

### Khac phuc su co
- **Khong thay email gui**: mo DevTools > Console xem log `EmailJS...`. Thuong la thieu public key, sai service/template ID, hoac EmailJS chua khoi tao.
- **Vuot han muc**: goi Free cua EmailJS gioi han ~200 email/thang. Nang cap hoac chia nho san luong neu can.
- **Muon tat EmailJS**: bo public key (de trong) hoac xoa script config.

## Option 2: Firebase Cloud Function (can goi Blaze)

### Tong quan
- `functions/index.js` van san sang neu ban nang cap du an len goi Blaze.
- Ham `sendOrderConfirmation` lang nghe collection `orders`, dung Nodemailer gui email tu SMTP (vi du Gmail App Password).

### Dieu kien
- Firebase project phai o goi Blaze (yeu cau bo sung phuong thuc thanh toan).
- Da cai Firebase CLI (`npm install -g firebase-tools`) va dang nhap `firebase login`.

### Thiet lap
1. Chay `cd functions && npm install`, sau do `cd ..`.
2. Thiet lap cau hinh mailer (vi du Gmail + App Password):
   ```bash
   firebase functions:config:set \
     mailer.host="smtp.gmail.com" \
     mailer.port="587" \
     mailer.secure="false" \
     mailer.user="catchyboardgame@gmail.com" \
     mailer.pass="APP_PASSWORD_16_KY_TU" \
     mailer.from="Catchy Team <catchyboardgame@gmail.com>" \
     mailer.reply_to="catchyboardgame@gmail.com"
   ```
3. Deploy: `firebase deploy --only functions:sendOrderConfirmation`.

### Test & troubleshooting
- Tao don hang moi trong Firestore hoac qua form, xem log tai Firebase Console > Functions. Thay dong `Sent order confirmation email.` la thanh cong.
- Loi SMTP: kiem tra App Password, port, hoac bat 2FA.
- Neu can chinh sua noi dung email, sua ham `buildEmailContent` trong `functions/index.js` roi deploy lai.

> Luu y: API `functions.config()` se bi khai tu thang 03/2026. Neu chuyen sang Option 2 lau dai, can ke hoach dung `.env` hoac Secret Manager theo huong dan cua Firebase.
