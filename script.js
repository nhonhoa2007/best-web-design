import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// TODO: Thay thế bằng cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyBDV2PqxXXvyIBsgDqpQsu2m4KrOOV6oPw",
  authDomain: "best-web-design.firebaseapp.com",
  projectId: "best-web-design",
  storageBucket: "best-web-design.firebasestorage.app",
  messagingSenderId: "274842395049",
  appId: "1:274842395049:web:b4f48a220e9ee58cae24b8",
  measurementId: "G-79K2KJW125"
};

// Khởi tạo Firebase (sẽ báo lỗi ở console nếu config không đúng)
let app, auth;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} catch (e) {
    console.error("Lỗi khởi tạo Firebase. Vui lòng kiểm tra firebaseConfig.", e);
}

let isLoginMode = true; // Theo dõi trạng thái form đang là Login hay Register

const STORAGE_KEYS = {
    avatar: "vkuQuestAvatar",
    customName: "vkuQuestCustomName",
    currentStep: "vkuQuestCurrentStep",
    unlockedStep: "vkuQuestUnlockedStep"
};

const PANORAMAS = {
    courtyard: "https://pannellum.org/images/alma.jpg",
    mountain: "https://pannellum.org/images/cerro-toco-0.jpg",
    hall: "https://pannellum.org/images/bma-0.jpg"
};

const avatars = [
    {
        id: "tan-sinh-vien",
        name: "Minh",
        role: "Tân sinh viên",
        icon: "ph-student",
        color: "#ffc84d",
        line: "Mình sẽ ghi lại mọi điểm quan trọng để ngày đầu đến trường không bị lạc."
    },
    {
        id: "nha-tham-hiem",
        name: "An",
        role: "Nhà thám hiểm",
        icon: "ph-compass",
        color: "#2dd4bf",
        line: "Mình sẽ đi theo tuyến và mở khóa từng khu như một bản đồ nhiệm vụ."
    },
    {
        id: "huong-dan-vien",
        name: "Vy",
        role: "Hướng dẫn viên",
        icon: "ph-map-trifold",
        color: "#7dd3fc",
        line: "Mình sẽ kết nối từng địa điểm với câu chuyện và chức năng của nó."
    },
    {
        id: "ky-su-tre",
        name: "Khoa",
        role: "Kỹ sư trẻ",
        icon: "ph-circuitry",
        color: "#fb7185",
        line: "Mình sẽ để ý những không gian học tập, thực hành và sinh hoạt."
    }
];

const route = [
    {
        id: "v-cong-chinh",
        zone: "khu-v",
        zoneName: "Khu V",
        title: "Cổng chính Khu V",
        shortTitle: "Cổng chính",
        chapter: "Chặng 1",
        reward: "+10 định hướng",
        panorama: PANORAMAS.courtyard,
        mapCoords: { x: 46, y: 76 },
        body: "Đây là điểm khởi hành của hành trình. Từ cổng chính, người học bắt đầu hình dung cách các khu chức năng trong khu V kết nối với nhau.",
        notes: [
            "Điểm nhận diện đầu tiên khi đến khu V.",
            "Phù hợp để đặt hướng dẫn nhập học hoặc điểm hẹn nhóm.",
            "Từ đây có thể dẫn tiếp đến các giảng đường chính."
        ],
        mission: "Xác định hướng đi đến giảng đường A và B trước khi sang điểm tiếp theo.",
        dialog: "Mình đã vào khu V. Trước mắt cứ nắm cổng, trục di chuyển chính và các giảng đường gần nhất."
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
        panorama: PANORAMAS.hall,
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
        id: "k-e",
        zone: "khu-k",
        zoneName: "Khu K",
        title: "Các Trung tâm, VP & Giảng đường (E)",
        shortTitle: "Khu E",
        chapter: "Chặng 10",
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
        chapter: "Chặng 11",
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
        chapter: "Chặng 12",
        reward: "+10 lớp học",
        panorama: PANORAMAS.hall,
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
        chapter: "Chặng 13",
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
        chapter: "Chặng 14",
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
        chapter: "Chặng 15",
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
        chapter: "Chặng 16",
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
        chapter: "Chặng 17",
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

const routeIndexById = new Map(route.map((scene, index) => [scene.id, index]));
const avatarById = new Map(avatars.map((avatar) => [avatar.id, avatar]));

let viewer;
let selectedAvatar = avatars[0];
let customName = "Khách";
let currentStep = 0;
let unlockedStep = 0;
let activeMapZone = "khu-v";
let toastTimer;

document.addEventListener("DOMContentLoaded", () => {
    setupAuthUI();
    
    if (auth) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Đã đăng nhập
                document.getElementById("auth-screen").classList.add("hidden");
                
                // Nếu chưa vào tour, hiện màn hình chọn Avatar
                if (document.getElementById("tour-app").classList.contains("hidden")) {
                    document.getElementById("avatar-screen").classList.remove("hidden");
                }
                
                renderAvatarOptions();
                hydrateState();
                bindControls();
                renderResumeButton();
                preloadPanoramas();
            } else {
                // Chưa đăng nhập
                document.getElementById("auth-screen").classList.remove("hidden");
                document.getElementById("avatar-screen").classList.add("hidden");
                document.getElementById("tour-app").classList.add("hidden");
            }
        });
    } else {
        // Fallback nếu Firebase lỗi
        renderAvatarOptions();
        hydrateState();
        bindControls();
        renderResumeButton();
        preloadPanoramas();
    }
});

function setupAuthUI() {
    const form = document.getElementById("auth-form");
    const toggleLink = document.getElementById("auth-toggle-link");
    const toggleText = document.getElementById("auth-toggle-text");
    const title = document.getElementById("auth-title");
    const submitBtn = document.getElementById("auth-submit-btn");

    toggleLink.addEventListener("click", (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            title.textContent = "Đăng nhập";
            submitBtn.textContent = "Đăng nhập";
            toggleText.innerHTML = 'Chưa có tài khoản? <a href="#" id="auth-toggle-link">Đăng ký ngay</a>';
        } else {
            title.textContent = "Đăng ký";
            submitBtn.textContent = "Đăng ký";
            toggleText.innerHTML = 'Đã có tài khoản? <a href="#" id="auth-toggle-link">Đăng nhập</a>';
        }
        // Gắn lại sự kiện cho link mới tạo
        setupAuthUI();
    });

    // Chỉ gắn submit 1 lần để tránh bị lặp khi gọi lại setupAuthUI
    if (!form.hasAttribute("data-listener")) {
        form.setAttribute("data-listener", "true");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value; 
            const password = document.getElementById("password").value;

            if (!auth) {
                showToast("Cấu hình Firebase chưa được thiết lập.");
                return;
            }

            try {
                if (isLoginMode) {
                    await signInWithEmailAndPassword(auth, email, password);
                    showToast("Đăng nhập thành công!");
                } else {
                    await createUserWithEmailAndPassword(auth, email, password);
                    showToast("Đăng ký thành công!");
                }
            } catch (error) {
                showToast(error.message || "Đã xảy ra lỗi.");
                console.error("Auth Error:", error);
            }
        });
    }
}

function hydrateState() {
    const savedAvatar = localStorage.getItem(STORAGE_KEYS.avatar);
    const savedName = localStorage.getItem(STORAGE_KEYS.customName);
    const savedCurrent = Number(localStorage.getItem(STORAGE_KEYS.currentStep));
    const savedUnlocked = Number(localStorage.getItem(STORAGE_KEYS.unlockedStep));

    selectedAvatar = avatarById.get(savedAvatar) || avatars[0];
    customName = savedName || "Khách";
    currentStep = Number.isFinite(savedCurrent) ? clamp(savedCurrent, 0, route.length - 1) : 0;
    unlockedStep = Number.isFinite(savedUnlocked) ? clamp(savedUnlocked, currentStep, route.length - 1) : currentStep;
}

function renderAvatarOptions() {
    const container = document.getElementById("avatar-options");
    container.innerHTML = avatars.map((avatar) => `
        <button class="avatar-card" type="button" data-avatar="${avatar.id}" style="--avatar-color: ${avatar.color}">
            <span class="avatar-face"><i class="ph ${avatar.icon}"></i></span>
            <span>
                <strong>${avatar.role}</strong>
            </span>
            <span>${avatar.line}</span>
        </button>
    `).join("");

    let tempSelectedId = null;
    const nameInput = document.getElementById("custom-avatar-name");
    const startBtn = document.getElementById("start-new-tour-btn");

    const checkReady = () => {
        if (tempSelectedId && nameInput.value.trim().length > 0) {
            startBtn.disabled = false;
        } else {
            startBtn.disabled = true;
        }
    };

    nameInput.addEventListener("input", checkReady);

    const cards = container.querySelectorAll(".avatar-card");
    cards.forEach((button) => {
        button.addEventListener("click", () => {
            cards.forEach(c => c.classList.remove("selected"));
            button.classList.add("selected");
            tempSelectedId = button.dataset.avatar;
            checkReady();
        });
    });

    startBtn.addEventListener("click", () => {
        const avatar = avatarById.get(tempSelectedId);
        const inputName = nameInput.value.trim();
        if (!avatar || !inputName) return;

        selectedAvatar = avatar;
        customName = inputName;
        currentStep = 0;
        unlockedStep = 0;
        persistState();
        startTour();
    });
}

function renderResumeButton() {
    const resumeButton = document.getElementById("resume-tour");
    const hasProgress = Boolean(localStorage.getItem(STORAGE_KEYS.avatar));
    resumeButton.classList.toggle("hidden", !hasProgress);
}

function bindControls() {
    document.getElementById("resume-tour").addEventListener("click", startTour);
    document.getElementById("change-avatar").addEventListener("click", showAvatarScreen);
    document.getElementById("restart-tour").addEventListener("click", restartTour);
    document.getElementById("prev-step").addEventListener("click", () => loadStep(currentStep - 1));
    document.getElementById("next-step").addEventListener("click", goNext);
    document.getElementById("tab-khu-v").addEventListener("click", () => focusZone("khu-v"));
    document.getElementById("tab-khu-k").addEventListener("click", () => focusZone("khu-k"));
    
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (auth) {
                signOut(auth).then(() => {
                    showToast("Đã đăng xuất.");
                }).catch((error) => {
                    showToast("Lỗi đăng xuất.");
                });
            }
        });
    }
}

function startTour() {
    document.getElementById("avatar-screen").classList.add("hidden");
    document.getElementById("tour-app").classList.remove("hidden");

    if (!viewer) {
        initViewer();
    }

    loadStep(currentStep, { forceViewer: true });
}

function showAvatarScreen() {
    document.getElementById("tour-app").classList.add("hidden");
    document.getElementById("avatar-screen").classList.remove("hidden");
    renderResumeButton();
}

function restartTour() {
    currentStep = 0;
    unlockedStep = 0;
    persistState();
    loadStep(0, { forceViewer: true });
    showToast("Hành trình đã bắt đầu lại từ cổng chính Khu V.");
}

function initViewer() {
    if (!window.pannellum) {
        showToast("Không tải được trình xem 360. Nội dung tour vẫn dùng được.");
        renderExperience();
        return;
    }

    const pannellumScenes = {};
    route.forEach((scene, index) => {
        pannellumScenes[scene.id] = {
            title: scene.title,
            type: "equirectangular",
            panorama: scene.panorama,
            autoLoad: true,
            hotSpots: createHotspots(index)
        };
    });

    viewer = pannellum.viewer("panorama", {
        default: {
            firstScene: route[currentStep].id,
            author: "VKU",
            autoLoad: true,
            compass: true,
            sceneFadeDuration: 800
        },
        scenes: pannellumScenes
    });

    viewer.on("scenechange", (sceneId) => {
        const nextIndex = routeIndexById.get(sceneId);
        if (typeof nextIndex !== "number") return;

        if (nextIndex > unlockedStep + 1) {
            showToast("Điểm này chưa mở khóa. Hãy đi theo tuyến nhiệm vụ.");
            loadStep(currentStep, { forceViewer: true });
            return;
        }

        currentStep = nextIndex;
        unlockedStep = Math.max(unlockedStep, nextIndex);
        activeMapZone = route[nextIndex].zone;
        persistState();
        renderExperience();
    });
}

function createHotspots(index) {
    const hotSpots = [];
    const next = route[index + 1];
    const previous = route[index - 1];

    if (next) {
        hotSpots.push({
            pitch: -4,
            yaw: 32,
            type: "scene",
            text: `Đi tiếp: ${next.shortTitle}`,
            sceneId: next.id,
            cssClass: "quest-hotspot next",
            createTooltipFunc: customHotspot,
            createTooltipArgs: `Đi tiếp: ${next.shortTitle}`
        });
    }

    if (previous) {
        hotSpots.push({
            pitch: -6,
            yaw: -34,
            type: "scene",
            text: `Quay lại: ${previous.shortTitle}`,
            sceneId: previous.id,
            cssClass: "quest-hotspot previous",
            createTooltipFunc: customHotspot,
            createTooltipArgs: `Quay lại: ${previous.shortTitle}`
        });
    }

    return hotSpots;
}

function customHotspot(hotSpotDiv, label) {
    hotSpotDiv.classList.add("custom-tooltip");
    const span = document.createElement("span");
    span.textContent = label;
    hotSpotDiv.appendChild(span);
}

function goNext() {
    if (currentStep >= route.length - 1) {
        showCongratsScreen();
        return;
    }

    loadStep(currentStep + 1);
}

function showCongratsScreen() {
    document.getElementById("congrats-avatar-name").textContent = customName;
    const congratsScreen = document.getElementById("congrats-screen");
    congratsScreen.classList.remove("hidden");
    
    // Đảm bảo chỉ gắn event 1 lần
    if (!congratsScreen.hasAttribute("data-listener")) {
        congratsScreen.setAttribute("data-listener", "true");
        
        document.getElementById("review-tour-btn").addEventListener("click", () => {
            congratsScreen.classList.add("hidden");
        });
        
        document.getElementById("restart-tour-btn-congrats").addEventListener("click", () => {
            congratsScreen.classList.add("hidden");
            restartTour();
        });
    }
}

function loadStep(index, options = {}) {
    if (index < 0 || index >= route.length) return;

    if (index > unlockedStep + 1) {
        showToast("Điểm này chưa mở khóa. Hãy hoàn thành các chặng trước.");
        return;
    }

    currentStep = index;
    unlockedStep = Math.max(unlockedStep, index);
    activeMapZone = route[index].zone;
    persistState();

    if (viewer) {
        const sceneId = route[index].id;
        const currentScene = typeof viewer.getScene === "function" ? viewer.getScene() : null;
        if (options.forceViewer || currentScene !== sceneId) {
            viewer.loadScene(sceneId);
        }
    }

    renderExperience();
}

function renderExperience() {
    const scene = route[currentStep];
    const progress = Math.round(((unlockedStep + 1) / route.length) * 100);

    document.getElementById("current-zone-label").textContent = scene.zoneName;
    document.getElementById("progress-label").textContent = `${unlockedStep + 1}/${route.length}`;
    document.getElementById("progress-bar").style.width = `${progress}%`;

    renderProfile();
    renderStory(scene);
    renderRouteList();
    renderMap();
}

function renderProfile() {
    const avatarMarkup = `<i class="ph ${selectedAvatar.icon}"></i>`;
    const colorStyle = selectedAvatar.color;

    document.getElementById("profile-avatar").style.setProperty("--avatar-color", colorStyle);
    document.getElementById("dialog-avatar").style.setProperty("--avatar-color", colorStyle);
    document.getElementById("profile-avatar").innerHTML = avatarMarkup;
    document.getElementById("dialog-avatar").innerHTML = avatarMarkup;
    document.getElementById("profile-name").textContent = customName;
    document.getElementById("profile-role").textContent = selectedAvatar.role;
}

function renderStory(scene) {
    document.getElementById("scene-chapter").textContent = scene.chapter;
    document.getElementById("scene-reward").textContent = scene.reward;
    document.getElementById("avatar-line").textContent = `${customName}: ${scene.dialog}`;
    document.getElementById("scene-title").textContent = scene.title;
    document.getElementById("scene-body").textContent = scene.body;
    document.getElementById("scene-mission").textContent = scene.mission;

    const notes = document.getElementById("scene-notes");
    notes.innerHTML = scene.notes.map((note) => `
        <li><i class="ph ph-sparkle"></i><span>${note}</span></li>
    `).join("");

    const prevButton = document.getElementById("prev-step");
    const nextButton = document.getElementById("next-step");
    prevButton.disabled = currentStep === 0;
    nextButton.innerHTML = currentStep === route.length - 1
        ? 'Hoàn thành <i class="ph ph-flag-checkered"></i>'
        : 'Đi tiếp <i class="ph ph-arrow-right"></i>';
}

function renderRouteList() {
    const list = document.getElementById("route-list");
    const activeZoneScenes = route
        .map((scene, index) => ({ scene, index }))
        .filter(({ scene }) => scene.zone === activeMapZone);

    list.innerHTML = activeZoneScenes.map(({ scene, index }) => {
        const isCurrent = index === currentStep;
        const isVisited = index <= unlockedStep;
        const isLocked = index > unlockedStep;
        const icon = isLocked ? "ph-lock" : isCurrent ? "ph-map-pin" : "ph-check";
        const classes = [
            "route-step",
            isCurrent ? "current" : "",
            isVisited ? "visited" : "",
            isLocked ? "locked" : ""
        ].filter(Boolean).join(" ");

        return `
            <button class="${classes}" type="button" data-step="${index}" ${isLocked ? "disabled" : ""}>
                <span class="route-icon"><i class="ph ${icon}"></i></span>
                <span class="route-copy">
                    <strong>${scene.shortTitle}</strong>
                    <span>${scene.chapter}</span>
                </span>
                <span class="route-zone">${scene.zoneName}</span>
            </button>
        `;
    }).join("");

    list.querySelectorAll(".route-step:not(.locked)").forEach((button) => {
        button.addEventListener("click", () => loadStep(Number(button.dataset.step)));
    });

    document.getElementById("tab-khu-v").classList.toggle("active", activeMapZone === "khu-v");
    document.getElementById("tab-khu-k").classList.toggle("active", activeMapZone === "khu-k");
}

function renderMap() {
    const currentScene = route[currentStep];
    const mapZoneName = activeMapZone === "khu-v" ? "Khu V" : "Khu K";
    const unlockedInZone = route.filter((scene, index) => scene.zone === activeMapZone && index <= unlockedStep).length;
    const totalInZone = route.filter((scene) => scene.zone === activeMapZone).length;

    document.getElementById("map-title").textContent = `Bản đồ ${mapZoneName}`;
    document.getElementById("unlock-label").textContent = `${unlockedInZone}/${totalInZone} điểm đã mở`;
    document.getElementById("map-image-v").hidden = activeMapZone !== "khu-v";
    document.getElementById("map-image-k").hidden = activeMapZone !== "khu-k";

    const dots = document.getElementById("map-dots");
    dots.innerHTML = route.map((scene, index) => {
        if (scene.zone !== activeMapZone) return "";

        const isCurrent = currentScene.id === scene.id;
        const isLocked = index > unlockedStep;
        const icon = isLocked ? "ph-lock" : isCurrent ? "ph-map-pin" : "ph-check";
        const classes = ["map-dot", isCurrent ? "current" : "", isLocked ? "locked" : ""].filter(Boolean).join(" ");

        return `
            <button class="${classes}" type="button" data-step="${index}" style="left: ${scene.mapCoords.x}%; top: ${scene.mapCoords.y}%;" ${isLocked ? "disabled" : ""}>
                <i class="ph ${icon}"></i>
                <span class="map-dot-label">${scene.title}</span>
            </button>
        `;
    }).join("");

    dots.querySelectorAll(".map-dot:not(.locked)").forEach((dot) => {
        dot.addEventListener("click", () => loadStep(Number(dot.dataset.step)));
    });
}

function focusZone(zone) {
    activeMapZone = zone;
    renderRouteList();
    renderMap();
}

function persistState() {
    localStorage.setItem(STORAGE_KEYS.avatar, selectedAvatar.id);
    localStorage.setItem(STORAGE_KEYS.customName, customName);
    localStorage.setItem(STORAGE_KEYS.currentStep, String(currentStep));
    localStorage.setItem(STORAGE_KEYS.unlockedStep, String(unlockedStep));
}

function preloadPanoramas() {
    new Set(route.map((scene) => scene.panorama)).forEach((src) => {
        const image = new Image();
        image.src = src;
    });
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.add("hidden"), 2600);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
