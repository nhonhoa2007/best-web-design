const PANORAMAS = {
    v_cong: "assets/panoramas/v_cong.webp",
    k_e: "assets/panoramas/k_e.webp",
    k_b: "assets/panoramas/k_b.webp",
    k_d2: "assets/panoramas/k_d2.webp",
    mountain: "assets/panoramas/k_e.webp",
    hall: "assets/panoramas/k_b.webp",
    courtyard: "assets/panoramas/v_cong.webp"
};

export const route = [
    {
        id: "v-cong-chinh",
        zone: "khu-v",
        zoneName: "Khu V",
        title: "Cổng chính Khu V",
        shortTitle: "Cổng chính",
        chapter: "Chặng 1",
        reward: "+10 định hướng",
        panorama: PANORAMAS.v_cong,
        mapCoords: { x: 46, y: 76 },
        body: "Đây là điểm khởi hành của hành trình. Từ cổng chính, người học bắt đầu hình dung cách các khu chức năng trong khu V kết nối với nhau.",
        notes: [
            "Điểm nhận diện đầu tiên khi đến khu V.",
            "Phù hợp để đặt hướng dẫn nhập học hoặc điểm hẹn nhóm.",
            "Từ đây có thể dẫn tiếp đến các giảng đường chính."
        ],
        mission: "Xác định hướng đi đến giảng đường A và B trước khi sang điểm tiếp theo.",
        dialog: "Mình đã vào khu V. Trước mắt cứ nắm cổng, trục di chuyển chính và các giảng đường gần nhất.",
        easterEggs: [
            {
                pitch: 15,
                yaw: 120,
                text: "✨ Bí mật: Check-in tại đài phun nước mini khu V!"
            }
        ]
    },
    {
        id: "v-va",
        zone: "khu-v",
        zoneName: "Khu V",
        title: "Giảng đường A (VA)",
        shortTitle: "Giảng đường A",
        chapter: "Chặng 2",
        reward: "+10 học tập",
        panorama: PANORAMAS.mountain,
        mapCoords: { x: 27, y: 55 },
        body: "Giảng đường A là điểm học tập quan trọng trong tuyến khu V. Nội dung tại đây nên giúp người xem hiểu khu này dùng cho lớp học, lịch học và định vị phòng.",
        notes: [
            "Nên bổ sung ảnh thật hoặc video ngắn về hành lang/lớp học.",
            "Có thể hiển thị mẹo tìm phòng theo tầng hoặc ký hiệu.",
            "Là điểm phù hợp để giới thiệu nhịp học thường ngày."
        ],
        mission: "Ghi nhớ ký hiệu VA và vị trí tương đối so với cổng chính.",
        dialog: "Khu học đầu tiên đã mở khóa. Nếu có lịch học ở VA, người xem cần biết đi từ cổng vào như thế nào."
    },
    {
        id: "v-vb",
        zone: "khu-v",
        zoneName: "Khu V",
        title: "Giảng đường B (VB)",
        shortTitle: "Giảng đường B",
        chapter: "Chặng 3",
        reward: "+10 định vị",
        panorama: PANORAMAS.hall,
        mapCoords: { x: 54.5, y: 44 },
        body: "Giảng đường B giúp hoàn thiện cặp điểm học tập chính của khu V. Ở bước này, trải nghiệm nên làm rõ sự khác nhau giữa VA và VB.",
        notes: [
            "Có thể thêm thông tin phòng học, phòng thực hành hoặc khu hành lang.",
            "Nên có ảnh thật để người xem nhận diện mặt ngoài tòa nhà.",
            "Điểm này tạo nhịp chuyển trước khi kết thúc khu V."
        ],
        mission: "So sánh vị trí VB với VA trên bản đồ nhỏ.",
        dialog: "Mình đã có đủ hai mốc học tập chính ở khu V. Bước cuối của khu này là điểm phụ trợ."
    },
    {
        id: "v-bai-do-xe",
        zone: "khu-v",
        zoneName: "Khu V",
        title: "Bãi đỗ xe CBGV (Khu V)",
        shortTitle: "Bãi đỗ xe",
        chapter: "Chặng 4",
        reward: "+10 tiện ích",
        panorama: PANORAMAS.courtyard,
        mapCoords: { x: 27, y: 31 },
        body: "Một tour tốt không chỉ có tòa nhà chính. Những điểm tiện ích giúp người xem hiểu cách khuôn viên vận hành trong đời sống hằng ngày.",
        notes: [
            "Nên ghi rõ đây là khu vực dành cho ai để tránh nhầm lẫn.",
            "Có thể thêm ghi chú về luồng xe, lối đi bộ và điểm an toàn.",
            "Hoàn tất khu V trước khi mở khóa khu K."
        ],
        mission: "Hoàn thành ghi chú khu V và chuẩn bị chuyển sang khu K.",
        dialog: "Khu V đã xong. Mình đã có cổng, giảng đường và tiện ích cơ bản trước khi sang khu K."
    },
    {
        id: "k-hanh-chinh",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Trung tâm Hành chính",
        shortTitle: "Hành chính",
        chapter: "Chặng 5",
        reward: "+15 khu mới",
        panorama: PANORAMAS.mountain,
        mapCoords: { x: 50, y: 25 },
        body: "Khu K mở ra phần rộng hơn của hành trình. Trung tâm Hành chính là điểm neo tốt để giải thích các dịch vụ và thủ tục sinh viên.",
        notes: [
            "Nên bổ sung các phòng ban thường được sinh viên tìm đến.",
            "Có thể thêm giờ làm việc hoặc liên kết hướng dẫn thủ tục.",
            "Đây là điểm chuyển quan trọng sang hội trường và khu trung tâm."
        ],
        mission: "Mở khóa khu K bằng cách xác định vị trí trung tâm Hành chính trên bản đồ.",
        dialog: "Khu K đã mở. Mình sẽ lấy trung tâm Hành chính làm mốc để đi các điểm còn lại."
    },
    {
        id: "k-hoi-truong",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Hội trường tròn",
        shortTitle: "Hội trường",
        chapter: "Chặng 6",
        reward: "+10 sự kiện",
        panorama: PANORAMAS.hall,
        mapCoords: { x: 48, y: 18 },
        body: "Hội trường là nơi có thể kể câu chuyện về sự kiện, sinh hoạt cộng đồng và những khoảnh khắc lớn của sinh viên.",
        notes: [
            "Nội dung nên nhấn vào lễ, hội thảo, sinh hoạt và chương trình lớn.",
            "Có thể thêm ảnh bên trong để tăng cảm giác nhập vai.",
            "Điểm này giúp tour bớt khô vì có yếu tố cộng đồng."
        ],
        mission: "Ghi lại một hoạt động tiêu biểu có thể diễn ra tại hội trường.",
        dialog: "Địa điểm này nên có nhiều năng lượng hơn. Người xem cần thấy đây không chỉ là một tòa nhà."
    },
    {
        id: "k-thu-vien",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Viện eSTI & Thư viện",
        shortTitle: "Thư viện",
        chapter: "Chặng 7",
        reward: "+10 tri thức",
        panorama: PANORAMAS.courtyard,
        mapCoords: { x: 38, y: 20 },
        body: "Đây là điểm nên được xây như một trạm tri thức: học nhóm, tài liệu, nghiên cứu và không gian tự học.",
        notes: [
            "Nên thêm ảnh khu đọc sách, khu máy tính hoặc phòng tự học.",
            "Có thể hiển thị quy định sử dụng hoặc giờ mở cửa.",
            "Phù hợp để gắn nhiệm vụ tìm tài liệu hoặc học nhóm."
        ],
        mission: "Tìm điểm kết nối từ thư viện đến giảng đường A.",
        dialog: "Một tour nhập vai cần có trạm dừng để người xem hiểu đời sống học tập ngoài lớp."
    },
    {
        id: "k-f",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Trung tâm Sinh viên (F)",
        shortTitle: "Trung tâm SV",
        chapter: "Chặng 8",
        reward: "+10 sinh hoạt",
        panorama: PANORAMAS.mountain,
        mapCoords: { x: 62, y: 22 },
        body: "Trung tâm Sinh viên có thể là điểm kể về hoạt động, hỗ trợ và đời sống ngoài giờ học.",
        notes: [
            "Nên làm rõ sinh viên đến đây để làm gì.",
            "Có thể thêm các hoạt động câu lạc bộ hoặc dịch vụ sinh viên.",
            "Điểm này tạo cân bằng giữa học tập và trải nghiệm."
        ],
        mission: "Ghi nhớ ký hiệu F và mối liên hệ với trung tâm Hành chính.",
        dialog: "Nếu chỉ đi qua tòa nhà thì hơi phí. Điểm này nên có nội dung về nhịp sống sinh viên."
    },
    {
        id: "k-d1-d2",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Các Phòng, Khoa (D1, D2)",
        shortTitle: "D1, D2",
        chapter: "Chặng 9",
        reward: "+10 học vụ",
        panorama: PANORAMAS.k_d2,
        mapCoords: { x: 65, y: 40 },
        body: "D1, D2 phù hợp để giới thiệu các khoa, phòng chuyên môn hoặc nơi sinh viên cần liên hệ trong quá trình học.",
        notes: [
            "Có thể liệt kê khoa/phòng nổi bật theo từng tòa.",
            "Nên có thông tin định vị phòng làm việc thường gặp.",
            "Điểm này nên ưu tiên nội dung rõ ràng, dễ quét nhanh."
        ],
        mission: "Tìm một phòng/khoa quan trọng và ghi vào sổ khám phá.",
        dialog: "Đây là đoạn cần thông tin thực dụng. Người xem nên rời điểm này với một mốc rõ ràng."
    },
    {
        id: "k-d1-t1-khmt",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Tầng 1 Tòa D1 - Khoa KHMT",
        shortTitle: "Tầng 1: KHMT",
        chapter: "Chặng 10",
        reward: "+10 tri thức",
        panorama: PANORAMAS.courtyard,
        mapCoords: { x: 65, y: 41 },
        body: "Chào mừng bạn đến với Khoa Khoa học máy tính (KHMT) tại tầng 1 tòa D1. Đây là nơi đào tạo những chuyên gia hàng đầu về phần mềm và thuật toán.",
        notes: [
            "Khu vực văn phòng khoa và phòng thực hành cơ sở.",
            "Nơi giải đáp các thắc mắc về lộ trình học tập ngành KHMT.",
            "Điểm đến của những người đam mê lập trình và trí tuệ nhân tạo."
        ],
        mission: "Xác định vị trí văn phòng khoa KHMT.",
        dialog: "Tầng 1 là 'đại bản doanh' của Khoa Khoa học máy tính. Mọi hành trình về phần mềm đều bắt đầu từ đây."
    },
    {
        id: "k-d1-t2-ktmt",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Tầng 2 Tòa D1 - Khoa KTMT",
        shortTitle: "Tầng 2: KTMT",
        chapter: "Chặng 11",
        reward: "+10 kỹ thuật",
        panorama: PANORAMAS.mountain,
        mapCoords: { x: 65, y: 42 },
        body: "Tầng 2 là không gian của Khoa Kỹ thuật máy tính và Điện tử (KTMT). Nơi đây tập trung vào sự kết hợp giữa phần cứng và phần mềm.",
        notes: [
            "Hệ thống các phòng thí nghiệm nhúng và vi mạch.",
            "Nơi nghiên cứu về IoT, Robotics và phần cứng máy tính.",
            "Không gian sáng tạo cho những ý tưởng kết nối vạn vật."
        ],
        mission: "Tìm hiểu về các phòng thí nghiệm IoT tại tầng 2.",
        dialog: "Lên tầng 2, chúng ta sẽ thấy thế giới của phần cứng và hệ thống nhúng của khoa KTMT."
    },
    {
        id: "k-d1-t3-kts-tmdt",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Tầng 3 Tòa D1 - Khoa KTS & TMĐT",
        shortTitle: "Tầng 3: KTS",
        chapter: "Chặng 12",
        reward: "+10 kinh tế số",
        panorama: PANORAMAS.hall,
        mapCoords: { x: 65, y: 43 },
        body: "Tầng 3 dành cho Khoa Kinh tế số và Thương mại điện tử (KTS & TMĐT). Đây là cầu nối giữa công nghệ và các mô hình kinh doanh hiện đại.",
        notes: [
            "Văn phòng khoa và các phòng hội thảo kinh tế số.",
            "Nơi ươm mầm các startup và ý tưởng kinh doanh trên nền tảng số.",
            "Tập trung vào phân tích dữ liệu kinh doanh và marketing số."
        ],
        mission: "Khám phá phòng hội thảo tại tầng 3.",
        dialog: "Tầng cao nhất của hành trình D1 là nơi công nghệ gặp gỡ kinh doanh tại khoa Kinh tế số."
    },
    {
        id: "k-e",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Các Trung tâm, VP & Giảng đường (E)",
        shortTitle: "Khu E",
        chapter: "Chặng 13",
        reward: "+10 kết nối",
        panorama: PANORAMAS.courtyard,
        mapCoords: { x: 65, y: 60 },
        body: "Khu E là điểm kết hợp giữa học tập, văn phòng và trung tâm chức năng. Nội dung cần giúp người xem không nhầm vai trò của từng khu.",
        notes: [
            "Nên tách rõ văn phòng, trung tâm và giảng đường nếu có dữ liệu thật.",
            "Có thể thêm nhãn theo tầng hoặc khu vực.",
            "Điểm này nằm trên tuyến nối xuống phần trung tâm khu K."
        ],
        mission: "Xác định đường quay lại D1, D2 và đường đi tiếp về trung tâm.",
        dialog: "Mình đang đi vào cụm chức năng dày hơn. Nội dung ở đây nên được chia nhỏ để dễ nhớ."
    },
    {
        id: "k-a",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Giảng đường A",
        shortTitle: "Giảng đường A",
        chapter: "Chặng 14",
        reward: "+10 lớp học",
        panorama: PANORAMAS.mountain,
        mapCoords: { x: 40, y: 40 },
        body: "Giảng đường A trong khu K bắt đầu cụm học tập trung tâm. Đây là nơi nên dùng nội dung gần gũi với lịch học hằng ngày.",
        notes: [
            "Nên bổ sung ảnh lớp học, hành lang và biển tòa.",
            "Có thể đưa mẹo tìm phòng hoặc tuyến đi từ thư viện.",
            "Là điểm mở đầu cụm A, B, C."
        ],
        mission: "Theo dõi tuyến từ giảng đường A sang B và đài phun nước.",
        dialog: "Đến cụm giảng đường rồi. Bây giờ tour cần giữ nhịp nhanh để người xem không mất phương hướng."
    },
    {
        id: "k-b",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Giảng đường B",
        shortTitle: "Giảng đường B",
        chapter: "Chặng 15",
        reward: "+10 lớp học",
        panorama: PANORAMAS.k_b,
        mapCoords: { x: 40, y: 60 },
        body: "Giảng đường B là điểm tiếp nối trong cụm học tập. Nội dung nên giúp người xem hiểu tuyến A-B-C thay vì xem từng tòa rời rạc.",
        notes: [
            "Nên hiển thị hướng sang giảng đường A và C.",
            "Có thể thêm ảnh nhận diện mặt ngoài.",
            "Phù hợp để nhấn vào cách đọc bản đồ khu K."
        ],
        mission: "Xác định hướng đi sang giảng đường C.",
        dialog: "A và B đã nối được với nhau. Mình sẽ đi tiếp đến C để hoàn tất cụm này."
    },
    {
        id: "k-c",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Giảng đường C",
        shortTitle: "Giảng đường C",
        chapter: "Chặng 16",
        reward: "+10 hoàn tất cụm",
        panorama: PANORAMAS.courtyard,
        mapCoords: { x: 33, y: 55 },
        body: "Giảng đường C hoàn tất cụm học tập A-B-C. Đây là điểm tốt để tổng kết tuyến học tập trong khu K.",
        notes: [
            "Nên có một câu tổng kết cụm A-B-C.",
            "Có thể hiển thị mẹo di chuyển về trung tâm khu K.",
            "Điểm tiếp theo nên là một mốc dễ nhận diện."
        ],
        mission: "Tổng kết cụm A-B-C trước khi sang đài phun nước.",
        dialog: "Cụm giảng đường đã đủ. Mốc kế tiếp nên là nơi dễ nhớ nhất trên bản đồ."
    },
    {
        id: "k-dai-phun-nuoc",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Đài phun nước",
        shortTitle: "Đài phun nước",
        chapter: "Chặng 17",
        reward: "+10 mốc trung tâm",
        panorama: PANORAMAS.mountain,
        mapCoords: { x: 50, y: 50 },
        body: "Đài phun nước là mốc thị giác tốt để người xem tự định vị. Điểm này có thể dùng làm trạm nghỉ giữa hành trình.",
        notes: [
            "Nên dùng ảnh thật vì đây là mốc dễ ghi nhớ.",
            "Có thể thêm góc nhìn 360 đẹp để tạo điểm nhấn.",
            "Từ đây có thể rẽ sang khu thể thao hoặc các cụm chức năng."
        ],
        mission: "Dùng đài phun nước làm mốc để xác định hướng sang khu thể thao.",
        dialog: "Đây là mốc trung tâm. Nếu người xem nhớ được điểm này, họ sẽ dễ hình dung toàn khu K hơn."
    },
    {
        id: "k-the-thao",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Khu Thể thao",
        shortTitle: "Thể thao",
        chapter: "Chặng 18",
        reward: "+10 năng lượng",
        panorama: PANORAMAS.hall,
        mapCoords: { x: 22, y: 46 },
        body: "Khu thể thao đưa hành trình ra khỏi nhóm lớp học và phòng ban, giúp campus có cảm giác sống động hơn.",
        notes: [
            "Nên thêm thông tin sân, nhà thi đấu hoặc hoạt động thể thao.",
            "Có thể liên kết với câu lạc bộ hoặc sự kiện sinh viên.",
            "Điểm này dẫn tự nhiên đến sân bóng."
        ],
        mission: "Tìm đường từ khu thể thao xuống sân bóng.",
        dialog: "Sau nhiều điểm học tập, đoạn này làm tour có nhịp thở hơn. Đi tiếp đến sân bóng."
    },
    {
        id: "k-san-bong",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Sân bóng đá / Điền kinh",
        shortTitle: "Sân bóng",
        chapter: "Chặng 19",
        reward: "+10 hoạt động",
        panorama: PANORAMAS.courtyard,
        mapCoords: { x: 22, y: 60 },
        body: "Sân bóng và điền kinh là nơi thể hiện hoạt động ngoài giờ, giải đấu và tinh thần tập thể.",
        notes: [
            "Nên bổ sung ảnh toàn cảnh sân để tạo không gian mở.",
            "Có thể thêm nội dung về hoạt động thể chất hoặc giải sinh viên.",
            "Điểm này nằm gần tuyến đến ký túc xá."
        ],
        mission: "Quan sát vị trí sân so với khu ký túc xá.",
        dialog: "Đây là nơi kể về năng lượng của sinh viên. Điểm cuối sẽ là nơi sinh hoạt dài ngày."
    },
    {
        id: "k-ktx",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Khu Ký túc xá",
        shortTitle: "Ký túc xá",
        chapter: "Chặng 20",
        reward: "+20 hoàn thành",
        panorama: PANORAMAS.mountain,
        mapCoords: { x: 13, y: 35 },
        body: "Ký túc xá là điểm kết phù hợp vì nó đưa hành trình từ học tập sang đời sống. Đây là nơi nên có nội dung thực tế cho sinh viên mới.",
        notes: [
            "Nên thêm thông tin phòng ở, đăng ký, quy định và tiện ích gần đó.",
            "Có thể dùng điểm này để kết thúc tour bằng tổng kết toàn bộ hành trình.",
            "Hoàn thành tuyến khu V đến khu K."
        ],
        mission: "Hoàn thành sổ khám phá và xem lại các điểm đã mở khóa.",
        dialog: "Hành trình đã đủ một vòng. Bây giờ người xem có thể quay lại bất kỳ điểm nào đã mở khóa."
    }
];
