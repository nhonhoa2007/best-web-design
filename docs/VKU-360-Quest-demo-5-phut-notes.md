# VKU 360 Quest - Speaker Notes & Kịch Bản Demo 5 Phút

## Mục tiêu trình bày

Trong 5 phút, cần làm rõ 3 ý: VKU 360 Quest giải quyết nhu cầu tham quan trường theo cách trực quan, sản phẩm đã chạy được với tour 360, Forum và tiến trình cá nhân, và VKU Guide giúp người dùng hỏi theo đúng ngữ cảnh từng chặng.

## Speaker notes theo slide

### Slide 1 - Mở đầu

Em xin chào thầy cô và các bạn. Sản phẩm của em là VKU 360 Quest, một website biến việc tham quan VKU thành hành trình 360 độ có nhiệm vụ, tiến trình cá nhân, Forum cộng đồng và AI guide đồng hành. Trong 5 phút, em sẽ đi nhanh qua ý tưởng, công nghệ và demo luồng chính của sản phẩm.

### Slide 2 - Ý tưởng sản phẩm

Vấn đề là tân sinh viên hoặc khách tham quan thường khó hình dung các khu trong trường nếu chỉ xem ảnh, bài giới thiệu hay bản đồ tĩnh. VKU 360 Quest chuyển việc đó thành một hành trình: mỗi chặng có ảnh 360, câu chuyện ngắn, nhiệm vụ nhỏ và bước đi tiếp theo. Sau khi tham quan, người dùng có thể vào Forum để đặt câu hỏi, xem thông báo, theo dõi hoạt động CLB hoặc phản hồi các chủ đề. Điểm khác biệt là người dùng không chỉ xem thông tin, mà có cảm giác mình đang khám phá và tham gia vào cộng đồng trong trường.

### Slide 3 - Luồng trải nghiệm

Luồng sử dụng gồm 5 bước chính: đăng nhập, chọn avatar, vào tour 360, xem bản đồ lộ trình, và hỏi VKU Guide khi cần. Sau phần khám phá, người dùng có thể chuyển sang Forum để đăng chủ đề hoặc phản hồi thảo luận. Hệ thống bám theo tiến trình của người dùng, biết đang ở chặng nào và đã mở khóa tới đâu. Đây là lý do website không chỉ là panorama, mà là một hành trình có trạng thái và có lớp cộng đồng.

### Slide 4 - Kịch bản demo

Khi demo, em sẽ đi đúng theo flow này để chứng minh sản phẩm đang chạy thật. Đầu tiên là đăng nhập và trang chủ, tiếp theo vào tour 360 để xoay panorama và hoàn thành nhiệm vụ. Sau đó mở bản đồ/lộ trình, thử hỏi VKU Guide vài câu theo ngữ cảnh, rồi mở Forum để đăng chủ đề, lọc danh mục hoặc phản hồi trước khi kết thúc bằng profile/avatar. Ở phần Forum, em sẽ nhấn mạnh đây là nơi biến website từ công cụ tham quan thành không gian trao đổi của sinh viên.

### Slide 5 - Công nghệ sử dụng

Về công nghệ, frontend được giữ gọn bằng HTML, CSS và JavaScript để dễ deploy và chạy nhẹ. Firebase phụ trách đăng nhập, lưu tiến trình, hồ sơ, lịch sử chat, Forum, khoảnh khắc và ảnh upload. Riêng Forum dùng Firestore để lưu chủ đề và phản hồi, Storage để lưu ảnh đính kèm, còn quyền thao tác dựa trên trạng thái đăng nhập và chủ sở hữu bài viết. Cloud Functions nằm giữa frontend và Gemini API, nên API key không bị lộ trên mã nguồn phía client.

### Slide 6 - VKU Guide

VKU Guide không gọi Gemini trực tiếp từ trình duyệt. Mỗi câu hỏi được gửi qua Cloud Function, kèm theo ngôn ngữ, lịch sử chat, chặng hiện tại, bước hiện tại và trạng thái mở khóa. Function kiểm tra đăng nhập, giới hạn độ dài và làm sạch dữ liệu trước khi gọi model; nếu gặp lỗi quota thì có fallback offline.

### Slide 7 - Dữ liệu và phân quyền

Mỗi nhóm dữ liệu có nơi lưu và rule riêng. Tiến trình tour và lịch sử chat lưu theo UID; Forum lưu chủ đề, phản hồi, danh mục, số phản hồi, thời gian hoạt động gần nhất và ảnh đính kèm; khoảnh khắc/sự kiện có kiểm soát signed-in user và visibility; còn avatar và route là dữ liệu tĩnh trong repo. Với Forum, người đã đăng nhập mới được đăng hoặc phản hồi, chủ bài có quyền xóa chủ đề của mình, và khi có phản hồi mới thì hệ thống có thể tạo thông báo cho chủ đề. Thông điệp chính là Firebase giúp sản phẩm có tài khoản, đồng bộ tiến trình, quản lý cộng đồng và bảo vệ dữ liệu người dùng.

### Slide 8 - Kết luận

Tóm lại, VKU 360 Quest đã có nền tảng đủ để demo: trực quan bằng ảnh 360, tương tác bằng nhiệm vụ và tiến trình, cộng đồng bằng Forum, thông minh bằng VKU Guide, và có khả năng mở rộng thêm địa điểm, leaderboard, sự kiện hoặc quản trị nội dung. Forum là phần giúp sản phẩm sống lâu hơn sau khi người dùng đã tham quan xong, vì sinh viên vẫn có nơi hỏi đáp, xem hoạt động và quay lại tương tác. Sản phẩm có thể dùng cho tân sinh viên, khách tham quan và truyền thông tuyển sinh. Em xin cảm ơn thầy cô và các bạn đã lắng nghe.

## Kịch bản demo 5 phút

### 0:00 - 0:45 - Đăng nhập / Trang chủ

Mở trang đăng nhập hoặc trang chủ. Nếu đã đăng nhập, nói rõ hệ thống nhận diện tài khoản để lưu tiến trình riêng cho từng người. Bấm nút bắt đầu hoặc tiếp tục tour.

Lời thoại ngắn: "Ở đây sản phẩm không chỉ mở một trang giới thiệu. Khi có tài khoản, mỗi người sẽ có hành trình riêng, có chặng đã mở khóa và có tiến trình để tiếp tục lần sau."

### 0:45 - 1:45 - Tour 360

Vào màn hình tour, xoay panorama, chỉ vào mô tả chặng, nhiệm vụ và nút đi tiếp. Nếu có thể, hoàn thành một nhiệm vụ nhỏ hoặc chuyển sang chặng tiếp theo.

Lời thoại ngắn: "Phần trung tâm là không gian 360 độ. Bên cạnh đó, người dùng có câu chuyện và nhiệm vụ nhỏ nên không bị rơi vào việc chỉ xem ảnh, mà biết mình cần làm gì tiếp."

### 1:45 - 2:35 - Bản đồ và lộ trình

Mở bản đồ/lộ trình. Chỉ rõ khu V, khu K, chặng hiện tại, chặng đã mở khóa và chặng chưa mở khóa nếu có.

Lời thoại ngắn: "Bản đồ giúp người dùng hiểu mình đang ở đâu trong toàn bộ hành trình. Với tân sinh viên, điều này quan trọng vì các em cần hình dung vị trí và chức năng từng khu."

### 2:35 - 3:45 - VKU Guide

Mở VKU Guide và hỏi 2-3 câu ngắn:

- "Tôi đang ở đâu?"
- "Nhiệm vụ tiếp theo là gì?"
- "Phòng đào tạo làm gì?"

Lời thoại ngắn: "Guide trả lời dựa trên chặng hiện tại và dữ liệu nên câu trả lời có ngữ cảnh. API key không nằm ở frontend, mà đi qua Cloud Function để an toàn hơn."

### 3:45 - 4:35 - Forum / Hồ sơ / Avatar

Mở Forum ở trang sự kiện/cộng đồng. Nếu có sẵn dữ liệu, chọn một chủ đề đang hiển thị để mở phần chi tiết; nếu chưa có dữ liệu, tạo nhanh một chủ đề demo với tiêu đề ngắn, nội dung ngắn và danh mục phù hợp. Chỉ rõ 4 danh mục: Sự kiện, Hỏi đáp, CLB và Thông báo. Sau đó mở phần chi tiết, nhập một phản hồi ngắn để cho thấy chủ đề có luồng thảo luận chứ không chỉ là bài đăng một chiều. Nếu còn thời gian, mở nhanh profile/avatar để cho thấy thành tích và cá nhân hóa.

Lời thoại ngắn: "Forum giúp phần tham quan không dừng ở trải nghiệm cá nhân. Ví dụ tân sinh viên có thể hỏi về phòng ban, CLB có thể đăng hoạt động, ban tổ chức có thể đưa thông báo, và các bạn khác có thể phản hồi ngay trong chủ đề. Về kỹ thuật, chủ đề và phản hồi được lưu trên Firestore, ảnh đính kèm đi qua Storage, còn quyền đăng/xóa dựa trên tài khoản đăng nhập."

### 4:35 - 5:00 - Kết luận demo

Quay về slide kết luận hoặc màn hình chính. Chốt bằng giá trị cho tân sinh viên và hướng mở rộng.

Lời thoại ngắn: "Giá trị cốt lõi của VKU 360 Quest là kết hợp tour 360, dữ liệu tiến trình, Forum cộng đồng và AI guide thành một trải nghiệm tham quan có thể dùng thật. Sau này có thể mở rộng thêm địa điểm, sự kiện, leaderboard và công cụ quản trị nội dung."

## Ghi chú trả lời nếu bị hỏi sâu về Forum

- Forum đang nằm ở trang sự kiện/cộng đồng, dùng giao diện danh sách chủ đề bên trái và chi tiết thảo luận bên phải.
- Mỗi chủ đề có tiêu đề, nội dung, danh mục, tác giả, thời gian tạo, thời gian hoạt động gần nhất, số phản hồi và ảnh đính kèm nếu có.
- Danh mục hiện có: Sự kiện, Hỏi đáp, CLB và Thông báo. Khi demo nên lọc thử một danh mục để cho thấy dữ liệu có thể tổ chức theo nhu cầu.
- Người dùng đã đăng nhập mới được đăng chủ đề hoặc phản hồi. Chủ đề của người dùng có nút xóa để tránh người khác xóa nhầm nội dung.
- Ảnh đính kèm được upload lên Firebase Storage, còn metadata chủ đề được lưu trong Firestore.
- Khi có phản hồi mới, hệ thống có logic tạo notification cho chủ đề, giúp Forum có vòng tương tác thay vì chỉ là nơi đăng bài tĩnh.
- Nên nói ngắn: "Forum là lớp cộng đồng của sản phẩm: tour giúp biết địa điểm, VKU Guide giúp hỏi nhanh, còn Forum giúp sinh viên trao đổi và quay lại sau khi tham quan."
