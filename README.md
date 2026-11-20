# Notelysia Landing

Landing page cá nhân với React, TypeScript và Vite. Giao diện chạy hoàn toàn trên trình duyệt và có thể deploy dưới dạng site tĩnh trên Cloudflare Pages.

## Bắt đầu

Cần Node.js 20 hoặc 22+ và npm. Chạy `npm install`, sau đó `npm run dev` để phát triển. Các lệnh khác:

- `npm run test`: chạy kiểm thử.
- `npm run build`: kiểm tra TypeScript và tạo bản build tại `dist/`.
- `npm run preview`: xem thử bản build trên máy.

Site chạy được ngay cả khi chưa có email hoặc ảnh nền.

## Cấu trúc dự án

- `src/components/`: component theo chức năng (`avatar`, `background`, `services`, `weather`).
- `src/config/`: cấu hình chung và danh sách dịch vụ `services.json`.
- `src/assets/`: tài nguyên, bao gồm ảnh nền.
- `test/`: kiểm thử, chia theo cấu trúc component và cấu hình.

## Avatar Gravatar

Thêm email Gravatar của bạn vào `GRAVATAR_EMAIL` trong `.env` (tham khảo `.env.example`), rồi khởi động lại dev server hoặc build lại. Email được chuẩn hóa và băm SHA-256 trong quá trình build; mã trang chỉ chứa hash, không chứa email thô. `.env` được Git bỏ qua.

Hash vẫn công khai và có thể bị đối chiếu với email đã biết; không nên xem hash là biện pháp bảo mật email. Gravatar được dùng cho avatar, logo đầu trang và biểu tượng tab. Nếu chưa cấu hình email hoặc ảnh Gravatar không tồn tại, site hiển thị biểu tượng dự phòng.

## Dịch vụ và logo

Chỉnh danh sách trong `src/config/services.json`: mỗi nhóm có `id`, `label` và mảng `services`. Dùng `site` cho dịch vụ cá nhân, `team` cho dịch vụ nhóm. Mỗi dịch vụ có `name`, `description`, `color`, `icon` và có thể thêm `url` cùng `logo`. Màu hỗ trợ `blue`, `peach`, `purple`, `green`; icon hỗ trợ `cloud`, `photo`, `play`, `server`, `message`, `calendar`, `file`, `check`, `linux`.

Nếu không đặt `logo`, site tự dùng `/favicon.ico` từ domain của `url`. Đặt `logo` là URL ảnh hoặc đường dẫn đến file trong `public/`, ví dụ `/logos/my-service.png`, nếu ứng dụng dùng đường dẫn khác. Đặt `"logo": null` để luôn dùng icon từ thư viện; Cockpit dùng `"icon": "linux"` theo cách này. URL nên dùng `https://`. Thẻ có URL sẽ mở tab mới; logo bị lỗi sẽ thay bằng icon đã cấu hình.

Vite tự đọc JSON khi chạy dev. Sau khi thay đổi file, cần build và deploy lại để cập nhật site trên Cloudflare Pages; file không phải là cơ sở dữ liệu hay giao diện quản trị trực tuyến.

Các dịch vụ đã được cấu hình: AdGuard Home, Cockpit, Jellyfin và Gunny Taskbar. Jellyfin dùng đường dẫn favicon có hash theo phiên bản; nếu nâng cấp Jellyfin làm logo không tải được, cập nhật `logo` theo đường dẫn icon trên trang Jellyfin. Nếu favicon của dịch vụ yêu cầu đăng nhập hoặc không trả về ảnh, hãy cho phép truy cập ảnh công khai hoặc cấu hình file logo cục bộ. Mỗi nhóm có thể để trống.

## Ảnh nền

Đặt ảnh vào `src/assets/backgrounds/` với tên như `background-1.jpg`, `background-2.webp`, `background-10.png`. Hỗ trợ `.jpg`, `.jpeg`, `.png` và `.webp`; ảnh được sắp theo số. Nếu hai ảnh cùng số, tên file quyết định thứ tự. Build/deploy lại sau khi thêm hoặc thay ảnh. Không có ảnh thì dùng gradient mặc định; nút chuyển ảnh xuất hiện khi có ít nhất hai ảnh.

## Thời tiết

Widget xin quyền vị trí từ trình duyệt và lấy thời tiết hiện tại từ Open-Meteo, không cần API key. Geolocation yêu cầu HTTPS hoặc localhost. Nếu không cấp quyền hoặc vị trí không khả dụng, bạn có thể đặt `fallbackLocation` trong `src/config/site.ts`, ví dụ `{ latitude: 21.03, longitude: 105.85, name: 'Hà Nội' }`. Mặc định không có địa điểm dự phòng, widget sẽ hướng dẫn và cho phép thử lại. Lỗi mạng cũng có nút thử lại.

Chọn **Tìm địa điểm**, nhập ít nhất hai ký tự và chọn từ gợi ý của Open-Meteo. Có thể dùng phím mũi tên, Enter và Escape. Địa điểm đã chọn được lưu trong trình duyệt để dùng lại; chọn **Dùng vị trí hiện tại** để xóa lựa chọn và quay lại vị trí trình duyệt. Tên tìm kiếm và tọa độ dùng để lấy thời tiết được gửi tới Open-Meteo; không cần tài khoản hay API key.

## Cloudflare Pages

Kết nối repository với Cloudflare Pages, chọn build command `npm run build` và output directory `dist`. Đặt `GRAVATAR_EMAIL` trong environment variables của build trên Cloudflare, rồi deploy lại. Biến build cần được bảo vệ trong tài khoản Cloudflare; không commit email vào repository. Trang không yêu cầu backend.

Trong Cloudflare Pages, thêm `notelysia.com` ở **Custom domains** và làm theo hướng dẫn xác minh/cấu hình DNS cho domain gốc. Domain gốc phải thuộc zone Cloudflare tương ứng; kiểm tra các bản ghi hiện có trước khi thay đổi để không ảnh hưởng các subdomain dịch vụ. Việc cấu hình tại Cloudflare không được thực hiện tự động bởi dự án này.

## GitHub Actions deploy lên server riêng

Workflow `.github/workflows/deploy.yml` chạy test và build trên GitHub-hosted runner khi tạo pull request vào `main`, push lên `main` hoặc chạy thủ công. Khi push hoặc chạy thủ công trên `main`, GitHub gửi artifact `dist/` cho GitHub Actions self-hosted runner trên server để chép vào thư mục web. Server không cần mở SSH inbound; runner kết nối outbound tới GitHub. Build của pull request không nhận secret `GRAVATAR_EMAIL`.

Đăng ký thêm một **GitHub Actions self-hosted runner** trên server, gắn nhãn `notelysia-deploy` và chạy runner dưới tài khoản có quyền ghi vào thư mục web. Không chạy runner này bằng tài khoản `root`. Server cần outbound HTTPS tới GitHub để runner nhận job và tải artifact; `rsync` cần được cài trên server. Chỉ job deploy trên `main` dùng runner này, không dùng nó cho pull request.

Trong **Settings → Secrets and variables → Actions**, tạo:

- Variable `DEPLOY_PATH`, là thư mục tuyệt đối dành riêng cho website và có quyền ghi cho tài khoản chạy runner, ví dụ `/var/www/notelysia`.
- Secret `GRAVATAR_EMAIL` nếu muốn tạo avatar Gravatar khi build.

Lệnh đồng bộ xóa các file cũ trong `DEPLOY_PATH`, vì vậy không dùng chung thư mục này với dữ liệu khác.

GitLab Runner hiện có không trực tiếp chạy workflow GitHub Actions. Có thể cài GitHub Actions runner song song trên cùng server; hai runner là hai dịch vụ riêng biệt.
