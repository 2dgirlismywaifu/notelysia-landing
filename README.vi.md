# Notelysia Landing

Landing page cá nhân với React, TypeScript và Vite. Giao diện chạy hoàn toàn trên trình duyệt và có thể deploy dưới dạng site tĩnh trên Cloudflare Pages.

## Bắt đầu

Cần Node.js 20 hoặc 22+ và npm. Cài dependencies bằng `npm install`, sau đó chạy `npm run dev` để khởi động server phát triển.

| Lệnh              | Chức năng                                         |
|-------------------|---------------------------------------------------|
| `npm run dev`     | Khởi động server phát triển.                      |
| `npm run test`    | Chạy bộ kiểm thử.                                 |
| `npm run build`   | Kiểm tra TypeScript và tạo bản build tại `dist/`. |
| `npm run preview` | Xem thử bản build trên máy.                       |

Site chạy được ngay cả khi chưa có email hoặc ảnh nền.

Giao diện dùng animation CSS ngắn, bao gồm chuyển ảnh nền và trang dịch vụ, đồng thời tôn trọng tùy chọn giảm chuyển động của hệ điều hành.

## Cấu trúc dự án

| Đường dẫn         | Nội dung                                                      |
|-------------------|---------------------------------------------------------------|
| `src/components/` | Component chức năng: avatar, background, services và weather. |
| `src/config/`     | Cấu hình chung và danh sách dịch vụ `services.json`.          |
| `src/assets/`     | Tài nguyên được bundle, gồm ảnh nền và icon dịch vụ cục bộ.   |
| `test/`           | Kiểm thử, chia theo component và cấu hình.                    |

## Cấu hình trang

Chỉnh `src/config/site.ts` để đổi các cấu hình chung của trang. Sau khi đổi, build và deploy lại để cập nhật website.

| Cấu hình           | Chức năng                                           |
|--------------------|-----------------------------------------------------|
| `name`             | Tên trang hiển thị ở footer.                        |
| `sourceUrl`        | Link repository mở khi bấm nút GitHub trên topbar.  |
| `fallbackLocation` | Địa điểm dự phòng cho thời tiết; xem mục Thời tiết. |

## Avatar Gravatar

Thêm email Gravatar của bạn vào `GRAVATAR_EMAIL` trong `.env` (tham khảo `.env.example`), rồi khởi động lại dev server hoặc build lại. Email được chuẩn hóa và băm SHA-256 trong quá trình build; mã trang chỉ chứa hash, không chứa email thô. `.env` được Git bỏ qua.

Hash vẫn công khai và có thể bị đối chiếu với email đã biết; không nên xem hash là biện pháp bảo mật email. Gravatar được dùng cho avatar, logo đầu trang và biểu tượng tab. Nếu chưa cấu hình email hoặc ảnh Gravatar không tồn tại, site hiển thị biểu tượng dự phòng.

## Dịch vụ và logo

Chỉnh danh sách trong `src/config/services.json`. Mỗi nhóm có `id`, `label` và mảng `services`; dùng `site` cho dịch vụ cá nhân, `team` cho dịch vụ nhóm.

| Thuộc tính dịch vụ    | Chức năng                                                                                                                                |
|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `name`, `description` | Tên hiển thị và mô tả ngắn.                                                                                                              |
| `url`                 | Địa chỉ dịch vụ.                                                                                                                         |
| `redirect`            | `true` cho phép chuyển trang; `false` hiển thị thẻ không thể bấm. Mặc định là `true` nếu bỏ qua.                                         |
| `color`               | Màu icon của thẻ. Giá trị hỗ trợ: `blue`, `peach`, `purple`, `green`, `red`.                                                            |
| `icon`                | Icon dự phòng. Giá trị hỗ trợ: `cloud`, `photo`, `play`, `server`, `message`, `calendar`, `file`, `check`, `linux`, `shield`, `monitor`, `key`, `mail`. |
| `logo`                | URL ảnh, đường dẫn public, asset local được bundle, hoặc `null` để luôn dùng icon dự phòng.                                              |

| Cấu hình logo                    | Cách hoạt động                                              |
|----------------------------------|-------------------------------------------------------------|
| Bỏ qua `logo`                    | Tự dùng `/favicon.ico` từ domain trong `url`.               |
| URL ảnh hoặc đường dẫn `/public` | Tải ảnh theo đường dẫn, ví dụ `/logos/my-service.png`.      |
| `"logo": "asset:ten-file.ico"`   | Bundle file `.ico` trong `src/assets/ico/` bằng Vite.       |
| `"logo": null`                   | Luôn dùng icon từ thư viện; Cockpit dùng `"icon": "linux"`. |

Nên dùng URL `https://`. Link dịch vụ có thể bấm sẽ mở tab mới; nếu logo lỗi, icon đã cấu hình sẽ được dùng thay thế.

Danh sách dịch vụ hiện tại:

| Nhóm   | Dịch vụ                                              |
|--------|------------------------------------------------------|
| `site` | AdGuard Home, Cockpit, Jellyfin, VaultWarden, Stalwart OSS, WireGuard, RustDesk |
| `team` | Gunny Taskbar, Taskbar Land (Development)                     |

Jellyfin dùng đường dẫn favicon có version; nếu nâng cấp Jellyfin làm logo không tải được, hãy cập nhật `logo`. Nếu favicon yêu cầu đăng nhập hoặc không trả về ảnh, hãy dùng ảnh công khai hoặc bundle logo cục bộ. Mỗi nhóm có thể để trống.

Vite tự đọc JSON khi chạy dev. Sau khi thay đổi file, cần build và deploy lại để cập nhật site; đây không phải cơ sở dữ liệu hay giao diện quản trị trực tuyến.

Thẻ dịch vụ hiển thị bốn mục mỗi trang trên cả desktop và mobile. Component dùng chung `ServiceList` phân trang thay vì tạo thanh cuộn lồng bên trong.

Các dịch vụ đã được cấu hình: AdGuard Home, Cockpit, Jellyfin, VaultWarden, Stalwart OSS, WireGuard, RustDesk, Gunny Taskbar và Taskbar Land (Development). Jellyfin dùng đường dẫn favicon có hash theo phiên bản; nếu nâng cấp Jellyfin làm logo không tải được, cập nhật `logo` theo đường dẫn icon trên trang Jellyfin. Nếu favicon của dịch vụ yêu cầu đăng nhập hoặc không trả về ảnh, hãy cho phép truy cập ảnh công khai hoặc cấu hình file logo cục bộ. Mỗi nhóm có thể để trống.

## Ảnh nền

Đặt ảnh vào `src/assets/backgrounds/` với tên như `background-1.jpg`, `background-2.webp`, `background-10.png`. Hỗ trợ `.jpg`, `.jpeg`, `.png` và `.webp`; ảnh được sắp theo số. Nếu hai ảnh cùng số, tên file quyết định thứ tự. Build/deploy lại sau khi thêm hoặc thay ảnh. Không có ảnh thì dùng gradient mặc định. Khi có ít nhất hai ảnh, desktop hiển thị nút chuyển ở hai bên; mobile dùng thanh điều khiển nhỏ ở cạnh dưới với nút trước/sau và bộ đếm. Ảnh nền vẫn được làm mờ trên cả desktop và mobile.

Trên iOS, nền mở rộng vào safe area, còn nội dung và nút điều khiển vẫn nằm trong vùng an toàn. Khi mở từ màn hình chính, thanh trạng thái phủ lên nền. Các thanh giao diện của Safari do trình duyệt kiểm soát và không thể hiển thị ảnh nền của trang.

## Thời tiết

Widget xin quyền vị trí từ trình duyệt và lấy thời tiết hiện tại từ Open-Meteo, không cần API key. Geolocation yêu cầu HTTPS hoặc localhost. Nếu không cấp quyền hoặc vị trí không khả dụng, bạn có thể đặt `fallbackLocation` trong `src/config/site.ts`, ví dụ `{ latitude: 21.03, longitude: 105.85, name: 'Hà Nội' }`. Mặc định không có địa điểm dự phòng, widget sẽ hướng dẫn và cho phép thử lại. Lỗi mạng cũng có nút thử lại.

Chọn **Tìm địa điểm**, nhập ít nhất hai ký tự và chọn từ gợi ý của Open-Meteo. Có thể dùng phím mũi tên, Enter và Escape. Địa điểm đã chọn được lưu trong trình duyệt để dùng lại; chọn **Dùng vị trí hiện tại** để xóa lựa chọn và quay lại vị trí trình duyệt. Tên tìm kiếm và tọa độ dùng để lấy thời tiết được gửi tới Open-Meteo; không cần tài khoản hay API key.

## Cloudflare Pages

Kết nối repository với Cloudflare Pages, chọn build command `npm run build` và output directory `dist`. Đặt `GRAVATAR_EMAIL` trong environment variables của build trên Cloudflare, rồi deploy lại. Biến build cần được bảo vệ trong tài khoản Cloudflare; không commit email vào repository. Trang không yêu cầu backend.

Trong Cloudflare Pages, thêm `notelysia.com` ở **Custom domains** và làm theo hướng dẫn xác minh/cấu hình DNS cho domain gốc. Domain gốc phải thuộc zone Cloudflare tương ứng; kiểm tra các bản ghi hiện có trước khi thay đổi để không ảnh hưởng các subdomain dịch vụ. Việc cấu hình tại Cloudflare không được thực hiện tự động bởi dự án này.

## GitHub Actions deploy lên server riêng

Workflow `.github/workflows/deploy.yml` chạy test và build trên GitHub-hosted runner khi tạo pull request vào `main`, push lên `main` hoặc chạy thủ công. Khi push hoặc chạy thủ công trên `main`, GitHub gửi artifact `dist/` cho GitHub Actions self-hosted runner trên server để chép vào thư mục web. Server không cần mở SSH inbound; runner kết nối outbound tới GitHub. Build của pull request không nhận secret `GRAVATAR_EMAIL`.

Đăng ký thêm một **GitHub Actions self-hosted runner** trên server, gắn nhãn `notelysia-landing-ci` và chạy runner dưới tài khoản có quyền ghi vào thư mục web. Không chạy runner này bằng tài khoản `root`. Server cần outbound HTTPS tới GitHub để runner nhận job và tải artifact; `rsync` cần được cài trên server. Chỉ job deploy trên `main` dùng runner này, không dùng nó cho pull request.

Trong **Settings → Environments → `landing-env` → Environment variables**, tạo:

| Biến          | Chức năng                                                                                                  |
|---------------|------------------------------------------------------------------------------------------------------------|
| `DEPLOY_PATH` | Đường dẫn tuyệt đối dành riêng cho website, cần cho phép tài khoản runner ghi, ví dụ `/var/www/notelysia`. |

Trong **Settings → Secrets and variables → Actions → Repository secrets**, tạo secret `GRAVATAR_EMAIL` nếu muốn dùng Gravatar. Secret này cũng được truyền vào môi trường build khi cần.

Lệnh đồng bộ xóa các file cũ trong `DEPLOY_PATH`, vì vậy không dùng chung thư mục này với dữ liệu khác.

GitLab Runner hiện có không trực tiếp chạy workflow GitHub Actions. Có thể cài GitHub Actions runner song song trên cùng server; hai runner là hai dịch vụ riêng biệt.
