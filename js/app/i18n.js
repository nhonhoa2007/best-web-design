const LANGUAGE_KEY = "vkuQuestLanguage";
const SUPPORTED_LANGUAGES = ["vi", "en"];

const TEXT = {
    vi: {
        "lang.vi": "VI",
        "lang.en": "EN",
        "lang.label": "Ngôn ngữ",
        "meta.description": "VKU 360 Quest - hành trình khám phá khu V và khu K theo từng chặng.",
        "nav.dashboard": "Bảng điều khiển",
        "nav.quests": "Nhiệm vụ",
        "nav.leaderboard": "Xếp hạng",
        "nav.library": "Thư viện",
        "nav.profile": "Hồ sơ",
        "nav.events": "Sự kiện",
        "nav.controls": "Điều khiển",
        "nav.openMenu": "Mở thanh điều khiển",
        "nav.closeMenu": "Đóng thanh điều khiển",
        "nav.notifications": "Thông báo",
        "nav.account": "Tài khoản",
        "nav.settings": "Cài đặt",
        "nav.logout": "Đăng xuất",
        "action.map360": "Bản đồ 360",
        "action.getStarted": "Bắt đầu",
        "action.startTour": "Bắt đầu tour",
        "action.viewLeaderboard": "Xem xếp hạng",
        "action.back": "Quay lại",
        "action.next": "Đi tiếp",
        "action.finish": "Hoàn thành",
        "action.reviewTour": "Xem lại hành trình",
        "action.restart": "Chơi lại từ đầu",
        "action.uploadAvatar": "Tải avatar lên",
        "action.uploading": "Đang tải lên...",
        "action.viewAll": "Xem tất cả",
        "home.live": "VKU 360 Quest đang hoạt động",
        "home.heroTitle": "Khám phá khuôn viên VKU",
        "home.heroAccent": "theo cách hoàn toàn mới",
        "home.heroBody": "Bắt đầu hành trình số qua khuôn viên trường. Khám phá các địa điểm nổi bật, hoàn thành nhiệm vụ học thuật và leo bảng xếp hạng trong trải nghiệm 360 nhập vai.",
        "home.previewAlt": "Bản đồ khu V VKU",
        "home.cardActiveLabel": "Nhiệm vụ hiện tại",
        "home.cardActiveTitle": "Khám phá cổng chính",
        "home.cardProgressLabel": "Tiến độ",
        "home.cardProgressTitle": "20 điểm dừng",
        "home.featuresTitle": "Tính năng chính",
        "home.featuresBody": "Làm chủ khuôn viên qua thử thách tương tác và theo dõi tiến độ theo thời gian thực.",
        "home.featureMapTitle": "Bản đồ 3D tương tác",
        "home.featureMapBody": "Di chuyển trong khuôn viên bằng mô hình 360 tương tác. Tìm phòng học, phòng lab và vị trí nhiệm vụ một cách chính xác.",
        "home.featureAchievementTitle": "Thành tựu",
        "home.featureAchievementBody": "Nhận huy hiệu và mở khóa phần thưởng khi bạn hoàn thành các mốc học tập.",
        "home.featureRankingTitle": "Xếp hạng trực tiếp",
        "home.featureRankingBody": "Thi đấu cùng bạn bè theo thời gian thực. Theo dõi thứ hạng khoa và tiến độ khám phá khuôn viên.",
        "home.featureQuestTitle": "Nhiệm vụ linh hoạt",
        "home.featureQuestBody": "Tham gia các thử thách theo tuần gắn với sự kiện thực tế và lịch học trong trường.",
        "home.featureQuestPreview": "Hoàn thành tour thư viện",
        "home.footerRights": "© 2026 Nền tảng VKU 360 Quest. Bảo lưu mọi quyền.",
        "home.privacy": "Chính sách bảo mật",
        "home.terms": "Điều khoản dịch vụ",
        "home.directory": "Danh bạ khuôn viên",
        "home.contact": "Liên hệ bảo mật",
        "events.kicker": "Sự kiện campus",
        "events.title": "Ảnh sự kiện campus",
        "events.body": "Đăng và lưu lại những khoảnh khắc về trường trong các buổi campus, check-in, orientation, hội thảo và hoạt động sinh viên.",
        "events.album": "Album campus",
        "events.formTitle": "Đăng ảnh mới",
        "events.postPhoto": "Đăng ảnh",
        "events.eventName": "Tên buổi campus",
        "events.eventNamePlaceholder": "Ví dụ: Ngày định hướng, Open Campus...",
        "events.photo": "Ảnh sự kiện",
        "events.choosePhoto": "Chọn ảnh",
        "events.noFileSelected": "Chưa chọn ảnh",
        "events.photoHelp": "Ảnh tối đa 5MB.",
        "events.caption": "Caption",
        "events.captionPlaceholder": "Viết vài dòng về khoảnh khắc này...",
        "events.galleryTitle": "Album campus",
        "events.emptyLogin": "Đăng nhập để đăng và xem ảnh sự kiện campus.",
        "events.loadingGallery": "Đang tải album campus...",
        "events.empty": "Chưa có ảnh sự kiện nào. Hãy đăng khoảnh khắc đầu tiên.",
        "events.loadError": "Không tải được album campus. Vui lòng thử lại sau.",
        "events.previewAlt": "Ảnh xem trước sự kiện campus",
        "events.imageAlt": "Ảnh sự kiện {title}",
        "events.fallbackTitle": "Sự kiện campus",
        "events.saving": "Đang đăng...",
        "toast.needLoginEventPhoto": "Bạn cần đăng nhập để đăng ảnh sự kiện.",
        "toast.eventMissingFields": "Vui lòng nhập tên buổi campus, caption và chọn ảnh.",
        "toast.eventPhotoSaved": "Đã đăng ảnh sự kiện.",
        "toast.eventPhotoSaveError": "Không đăng được ảnh sự kiện.",
        "toast.eventLoadError": "Không tải được album campus.",
        "toast.eventPhotoMax": "Ảnh sự kiện tối đa 5MB.",
        "quest.kicker": "Tuyến nhiệm vụ",
        "quest.title": "Quest theo từng chặng",
        "quest.body": "Mỗi điểm dừng mở một nhiệm vụ nhỏ để người học quan sát, ghi nhớ và tiếp tục hành trình đúng tuyến.",
        "leaderboard.kicker": "Xếp hạng trực tiếp",
        "leaderboard.title": "Bảng xếp hạng",
        "leaderboard.body": "Theo dõi người chơi nổi bật dựa trên số chặng đã hoàn thành và khoảnh khắc đã lưu.",
        "leaderboard.rank": "Hạng",
        "leaderboard.player": "Người chơi",
        "leaderboard.progress": "Tiến độ",
        "leaderboard.score": "Điểm",
        "leaderboard.loading": "Đang tải bảng xếp hạng",
        "leaderboard.localOnly": "Chỉ hiển thị tiến độ của bạn. Firestore rules hiện chưa cho đọc BXH toàn hệ thống.",
        "library.loadingTitle": "Đang tải nhật ký",
        "library.loadingBody": "Đang đồng bộ tiến độ, ghi chú và khoảnh khắc của bạn.",
        "library.unlockedStages": "chặng đã mở",
        "library.latest": "Gần nhất",
        "library.noMoments": "Bạn chưa lưu khoảnh khắc nào trong hành trình.",
        "library.kicker": "Thư viện hành trình",
        "library.title": "Nhật ký hành trình",
        "library.body": "Thư viện lưu lại các mốc đã đi qua, ghi chú quan sát và khoảnh khắc được đăng trong tour.",
        "library.unlockedTitle": "Mốc đã mở khóa",
        "profile.badge": "VKU Explorer",
        "profile.localAccount": "Tài khoản cục bộ",
        "profile.xpProgress": "Tiến độ XP",
        "profile.questsDone": "Nhiệm vụ xong",
        "profile.totalXp": "Tổng XP",
        "profile.ranking": "Thứ hạng",
        "profile.moments": "Khoảnh khắc",
        "profile.achievements": "Thành tựu của tôi",
        "profile.activity": "Hoạt động gần đây",
        "profile.loadingAchievements": "Đang tải achievements",
        "profile.noActivity": "Chưa có hoạt động",
        "profile.firebase": "Firebase",
        "profile.avatarSyncing": "Đang đồng bộ ảnh",
        "achievement.loginSync": "Đăng nhập để đồng bộ achievements từ Firebase.",
        "achievement.empty": "Chưa có achievement nào được mở khóa.",
        "achievement.loadError": "Không tải được achievements từ Firebase.",
        "achievement.navigator": "Đã đi qua hơn nửa lộ trình",
        "achievement.finisher": "Hoàn thành toàn bộ quest route",
        "achievement.momentKeeper": "{count} khoảnh khắc đã lưu",
        "achievement.campusSignal": "{count} cảm xúc đã nhận",
        "achievement.topExplorer": "Hạng #{rank} trên bảng xếp hạng",
        "notification.momentCreated": "Bạn đã đăng khoảnh khắc",
        "notification.momentUpdated": "Bạn đã chỉnh sửa bài viết",
        "notification.reactionReceived": "Có cảm xúc mới",
        "notification.default": "Thông báo",
        "notification.momentActivity": "Đăng khoảnh khắc: \"{caption}\"",
        "auth.loginTitle": "Đăng nhập",
        "auth.signupTitle": "Đăng ký",
        "auth.subtitle": "Bắt đầu hành trình khám phá VKU của bạn",
        "auth.email": "Email",
        "auth.emailPlaceholder": "Nhập email của bạn",
        "auth.password": "Mật khẩu",
        "auth.passwordPlaceholder": "Nhập mật khẩu",
        "auth.loginAction": "Đăng nhập",
        "auth.signupAction": "Đăng ký",
        "auth.needAccount": "Chưa có tài khoản?",
        "auth.hasAccount": "Đã có tài khoản?",
        "auth.signupNow": "Đăng ký ngay",
        "auth.loginNow": "Đăng nhập",
        "auth.loggingIn": "Đang đăng nhập...",
        "auth.signingUp": "Đang đăng ký...",
        "avatar.eyebrow": "Hành trình nhập vai",
        "avatar.title": "Chọn người đại diện để bắt đầu khám phá VKU",
        "avatar.body": "Đi từng khu, mở khóa từng địa điểm và thu thập ghi chú về những nơi quan trọng trong khuôn viên.",
        "avatar.nameLabel": "Tên nhân vật của bạn",
        "avatar.namePlaceholder": "Nhập tên bạn muốn (ví dụ: Sói cô độc, Imposter...)",
        "avatar.optionsLabel": "Chọn màu sắc/vai trò đại diện",
        "avatar.start": "Bắt đầu hành trình",
        "avatar.resume": "Tiếp tục hành trình trước",
        "tour.home": "Về trang chủ",
        "tour.openRoute": "Mở lộ trình",
        "tour.openMoments": "Mở khoảnh khắc",
        "tour.toggleStage": "Mở/tắt chặng",
        "tour.toggleAudio": "Bật/tắt âm thanh",
        "tour.changeAvatar": "Đổi avatar",
        "tour.logout": "Đăng xuất",
        "tour.route": "Lộ trình",
        "tour.routeHint": "Chọn chặng muốn xem",
        "tour.closeRoute": "Đóng lộ trình",
        "tour.representative": "Người đại diện",
        "tour.stageContent": "Nội dung địa điểm",
        "tour.notes": "Ghi chú khám phá",
        "tour.miniMission": "Nhiệm vụ nhỏ",
        "tour.moments": "Khoảnh khắc",
        "tour.momentsHint": "Ảnh và cảm nhận ở chặng hiện tại",
        "tour.closeMoments": "Đóng khoảnh khắc",
        "tour.postMoment": "Đăng khoảnh khắc",
        "tour.momentQuestion": "Bạn muốn lưu lại điều gì?",
        "tour.momentPlaceholder": "Viết một dòng ngắn về khoảnh khắc này...",
        "tour.mood": "Cảm xúc",
        "tour.visibility": "Hiển thị",
        "tour.private": "Chỉ mình tôi",
        "tour.public": "Công khai trong tour",
        "tour.photo": "Ảnh khoảnh khắc",
        "tour.photoHelp": "Ảnh tối đa 5MB. Khi sửa bài, chọn ảnh mới để thay ảnh cũ.",
        "tour.cancel": "Hủy",
        "tour.saveMoment": "Lưu khoảnh khắc",
        "tour.mapArea": "Bản đồ khu vực",
        "tour.closeMap": "Đóng bản đồ",
        "tour.openMap": "Mở bản đồ",
        "congrats.title": "Chúc mừng!",
        "congrats.body": "Bạn đã hoàn thành xuất sắc toàn bộ hành trình khám phá VKU 360 Quest.",
        "congrats.stages": "Chặng đã qua",
        "congrats.companion": "Người đồng hành",
        "route.stage": "Chặng",
        "route.zoneV": "Khu V",
        "route.zoneK": "Khu K",
        "unit.stage": "chặng",
        "unit.pointUnlocked": "điểm đã mở",
        "unit.post": "bài đăng",
        "fallback.explorer": "Explorer",
        "fallback.guest": "Khách",
        "status.justNow": "Vừa xong",
        "map.title": "Bản đồ {zone}",
        "map.alt": "Bản đồ {zone}",
        "hotspot.next": "Đi tiếp: {title}",
        "hotspot.previous": "Quay lại: {title}",
        "toast.firebaseMissing": "Cấu hình Firebase chưa được thiết lập.",
        "toast.loginSuccess": "Đăng nhập thành công!",
        "toast.signupSuccess": "Đăng ký thành công!",
        "toast.logoutSuccess": "Đã đăng xuất.",
        "toast.logoutError": "Lỗi đăng xuất.",
        "toast.nicknameSet": "Xin chào, {name}! Hành trình bắt đầu! 🎉",
        "nickname.confirm": "Bắt đầu hành trình",
        "nickname.errorMin": "Tên cần ít nhất 2 ký tự",
        "nickname.errorMax": "Tên không được quá 24 ký tự",
        "nickname.errorBlank": "Tên không được chỉ có khoảng trắng",
        "toast.needLoginAvatar": "Bạn cần đăng nhập để upload avatar.",
        "toast.avatarUpdated": "Đã cập nhật avatar.",
        "toast.avatarUploadedUnsynced": "Đã upload ảnh, nhưng chưa đồng bộ được profile.",
        "toast.avatarUploadError": "Không upload được avatar. Vui lòng thử lại.",
        "toast.imageOnly": "Chỉ hỗ trợ file ảnh.",
        "toast.avatarMax": "Avatar tối đa 5MB.",
        "toast.restart": "Hành trình đã bắt đầu lại từ cổng chính Khu V.",
        "toast.viewerMissing": "Không tải được trình xem 360. Nội dung tour vẫn dùng được.",
        "toast.lockedRoute": "Điểm này chưa mở khóa. Hãy đi theo tuyến nhiệm vụ.",
        "toast.lockedStep": "Điểm này chưa mở khóa. Hãy hoàn thành các chặng trước.",
        "toast.needLoginMomentPost": "Bạn cần đăng nhập để đăng khoảnh khắc.",
        "toast.needLoginMomentSave": "Bạn cần đăng nhập để lưu khoảnh khắc.",
        "toast.needCaption": "Vui lòng nhập caption cho khoảnh khắc.",
        "toast.momentUpdated": "Đã cập nhật khoảnh khắc.",
        "toast.momentSaved": "Đã lưu khoảnh khắc.",
        "toast.momentSaveError": "Không lưu được khoảnh khắc.",
        "toast.needLoginReaction": "Bạn cần đăng nhập để thả cảm xúc.",
        "toast.reactionRemoved": "Đã gỡ cảm xúc khỏi khoảnh khắc.",
        "toast.reactionSaved": "Đã thả cảm xúc cho khoảnh khắc.",
        "toast.reactionError": "Không thả được cảm xúc. Vui lòng thử lại.",
        "toast.momentDeleted": "Đã xóa khoảnh khắc.",
        "toast.momentDeleteError": "Không xóa được khoảnh khắc.",
        "toast.momentLoadError": "Không tải được khoảnh khắc.",
        "toast.photoMax": "Ảnh tối đa 5MB.",
        "confirm.deleteMoment": "Xóa khoảnh khắc này?",
        "auth.error.emailInUse": "Email này đã được đăng ký.",
        "auth.error.invalidEmail": "Email không hợp lệ.",
        "auth.error.invalidCredential": "Email hoặc mật khẩu không đúng.",
        "auth.error.network": "Không kết nối được Firebase. Kiểm tra mạng hoặc cấu hình project.",
        "auth.error.operation": "Bạn chưa bật phương thức đăng nhập Email/Password trong Firebase Authentication.",
        "auth.error.tooMany": "Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ một lúc rồi thử lại.",
        "auth.error.missingPassword": "Vui lòng nhập mật khẩu.",
        "auth.error.weakPassword": "Mật khẩu cần tối thiểu 6 ký tự.",
        "auth.error.userNotFound": "Không tìm thấy tài khoản.",
        "auth.error.wrongPassword": "Mật khẩu không đúng.",
        "auth.error.default": "Đã xảy ra lỗi.",
        "partial.error": "Không tải được {partial}",
        "partial.title": "Không tải được giao diện",
        "partial.hint": "Hãy chạy trang qua local server thay vì mở trực tiếp file HTML.",
        "moments.emptyLogin": "Đăng nhập để lưu và xem khoảnh khắc tại địa điểm này.",
        "moments.loading": "Đang tải khoảnh khắc...",
        "moments.empty": "Chưa có khoảnh khắc nào ở địa điểm này.",
        "moments.error": "Không tải được khoảnh khắc. Vui lòng thử lại sau.",
        "moments.previewAlt": "Ảnh xem trước khoảnh khắc",
        "moments.imageAlt": "Ảnh khoảnh khắc tại {sceneTitle}",
        "moments.like": "Thích",
        "moments.love": "Yêu thích",
        "moments.celebrate": "Chúc mừng",
        "moments.reactLabel": "Thả cảm xúc cho khoảnh khắc",
        "moments.publicLabel": "Công khai",
        "moments.privateLabel": "Chỉ mình tôi",
        "moments.edit": "Sửa",
        "moments.delete": "Xóa",
        "moments.saveLoading": "Đang lưu...",
        "moments.notificationUpdated": "Khoảnh khắc tại {sceneTitle} đã được cập nhật.",
        "moments.notificationCreated": "Bài viết mới tại {sceneTitle} đã được lưu vào nhật ký.",
        "moments.reactionTitle": "{name} đã thả cảm xúc {reaction}",
        "moments.reactionBody": "Khoảnh khắc \"{caption}\" vừa nhận tương tác mới.",
        "moments.yourMoment": "của bạn",
        "mood.excited": "Hào hứng",
        "mood.impressed": "Ấn tượng",
        "mood.peaceful": "Bình yên",
        "mood.proud": "Tự hào",
        "guide.title": "VKU Guide",
        "guide.subtitle": "Bạn đồng hành campus",
        "guide.placeholder": "Hỏi mình về chặng này nha...",
        "guide.welcome": "Xin chào nè, mình là VKU Guide. Bạn muốn hỏi đường, xin gợi ý hay khám phá nhiệm vụ nhỏ thì nhắn mình nha.",
        "guide.needLogin": "Bạn đăng nhập trước để mình dẫn đường nha.",
        "guide.needLoginLong": "Bạn đăng nhập xíu nhé, rồi mình sẽ bám theo tiến độ để chỉ đường thật vừa vặn cho bạn.",
        "guide.noFunctions": "Guide chưa được nối Cloud Functions nên mình chưa chat thật được nè.",
        "guide.noReply": "Mình chưa nghĩ ra câu trả lời hợp lý nè.",
        "guide.error": "Mình đang hơi kẹt tín hiệu. Bạn thử lại sau khi function deploy xong nha."
    },
    en: {
        "lang.vi": "VI",
        "lang.en": "EN",
        "lang.label": "Language",
        "meta.description": "VKU 360 Quest - a stage-by-stage journey through zones V and K.",
        "nav.dashboard": "Dashboard",
        "nav.quests": "Quests",
        "nav.leaderboard": "Leaderboard",
        "nav.library": "Library",
        "nav.profile": "Profile",
        "nav.events": "Events",
        "nav.controls": "Controls",
        "nav.openMenu": "Open navigation",
        "nav.closeMenu": "Close navigation",
        "nav.notifications": "Notifications",
        "nav.account": "Account",
        "nav.settings": "Settings",
        "nav.logout": "Logout",
        "action.map360": "Map 360",
        "action.getStarted": "Get Started",
        "action.startTour": "Start tour",
        "action.viewLeaderboard": "View Leaderboard",
        "action.back": "Back",
        "action.next": "Next",
        "action.finish": "Finish",
        "action.reviewTour": "Review journey",
        "action.restart": "Restart",
        "action.uploadAvatar": "Upload avatar",
        "action.uploading": "Uploading...",
        "action.viewAll": "View All",
        "home.live": "VKU 360 Quest Now Live",
        "home.heroTitle": "Explore the VKU Campus",
        "home.heroAccent": "Like Never Before",
        "home.heroBody": "Embark on a digital journey through the university. Discover hidden landmarks, complete academic quests, and climb the leaderboard in this immersive 360 experience.",
        "home.previewAlt": "VKU zone V map",
        "home.cardActiveLabel": "Active quest",
        "home.cardActiveTitle": "Main Gate Discovery",
        "home.cardProgressLabel": "Progress",
        "home.cardProgressTitle": "20 campus stops",
        "home.featuresTitle": "Key Features",
        "home.featuresBody": "Master the campus through interactive challenges and real-time tracking.",
        "home.featureMapTitle": "Interactive 3D Map",
        "home.featureMapBody": "Navigate the campus with a fully interactive 360 model. Find classrooms, labs, and hidden quest locations with pinpoint accuracy.",
        "home.featureAchievementTitle": "Achievements",
        "home.featureAchievementBody": "Earn badges and unlock rewards as you progress through academic milestones.",
        "home.featureRankingTitle": "Live Rankings",
        "home.featureRankingBody": "Compete with peers in real-time. Track your faculty standing and overall campus dominance.",
        "home.featureQuestTitle": "Dynamic Quests",
        "home.featureQuestBody": "Engage in weekly challenges tied to real-world campus events and academic schedules.",
        "home.featureQuestPreview": "Library Tour Complete",
        "home.footerRights": "© 2026 VKU 360 Quest Platform. All rights reserved.",
        "home.privacy": "Privacy Policy",
        "home.terms": "Terms of Service",
        "home.directory": "Campus Directory",
        "home.contact": "Contact Security",
        "events.kicker": "Campus Events",
        "events.title": "Campus event photos",
        "events.body": "Post and preserve school moments from campus days, check-ins, orientation sessions, workshops, and student activities.",
        "events.album": "Campus Album",
        "events.formTitle": "Post a new photo",
        "events.postPhoto": "Post photo",
        "events.eventName": "Campus event name",
        "events.eventNamePlaceholder": "Example: Orientation Day, Open Campus...",
        "events.photo": "Event photo",
        "events.choosePhoto": "Choose photo",
        "events.noFileSelected": "No file selected",
        "events.photoHelp": "Maximum image size is 5MB.",
        "events.caption": "Caption",
        "events.captionPlaceholder": "Write a few lines about this moment...",
        "events.galleryTitle": "Campus album",
        "events.emptyLogin": "Sign in to post and view campus event photos.",
        "events.loadingGallery": "Loading campus album...",
        "events.empty": "No event photos yet. Post the first moment.",
        "events.loadError": "Could not load the campus album. Please try again later.",
        "events.previewAlt": "Campus event preview image",
        "events.imageAlt": "Event photo for {title}",
        "events.fallbackTitle": "Campus event",
        "events.saving": "Posting...",
        "toast.needLoginEventPhoto": "You need to sign in to post an event photo.",
        "toast.eventMissingFields": "Please enter the campus event name, caption, and choose a photo.",
        "toast.eventPhotoSaved": "Event photo posted.",
        "toast.eventPhotoSaveError": "Could not post event photo.",
        "toast.eventLoadError": "Could not load the campus album.",
        "toast.eventPhotoMax": "Event photo size is limited to 5MB.",
        "quest.kicker": "Quest Route",
        "quest.title": "Stage-by-stage quests",
        "quest.body": "Each stop opens a focused task so learners can observe, remember, and continue along the right route.",
        "leaderboard.kicker": "Live Ranking",
        "leaderboard.title": "Leaderboard",
        "leaderboard.body": "Track standout players based on completed stages and saved moments.",
        "leaderboard.rank": "Rank",
        "leaderboard.player": "Player",
        "leaderboard.progress": "Progress",
        "leaderboard.score": "Score",
        "leaderboard.loading": "Loading leaderboard",
        "leaderboard.localOnly": "Only your progress is visible. Current Firestore rules do not allow reading the full system leaderboard.",
        "library.loadingTitle": "Loading journal",
        "library.loadingBody": "Syncing your progress, notes, and moments.",
        "library.unlockedStages": "unlocked stages",
        "library.latest": "Latest",
        "library.noMoments": "You have not saved any moments in this journey yet.",
        "library.kicker": "Journey Library",
        "library.title": "Journey journal",
        "library.body": "The library keeps visited milestones, observation notes, and moments posted during the tour.",
        "library.unlockedTitle": "Unlocked stops",
        "profile.badge": "VKU Explorer",
        "profile.localAccount": "Local account",
        "profile.xpProgress": "XP Progress",
        "profile.questsDone": "Quests Done",
        "profile.totalXp": "Total XP",
        "profile.ranking": "Ranking",
        "profile.moments": "Moments",
        "profile.achievements": "My Achievements",
        "profile.activity": "Recent Activity",
        "profile.loadingAchievements": "Loading achievements",
        "profile.noActivity": "No activity yet",
        "profile.firebase": "Firebase",
        "profile.avatarSyncing": "Syncing image",
        "achievement.loginSync": "Sign in to sync achievements from Firebase.",
        "achievement.empty": "No achievements unlocked yet.",
        "achievement.loadError": "Could not load achievements from Firebase.",
        "achievement.navigator": "Completed more than half of the route",
        "achievement.finisher": "Completed the full quest route",
        "achievement.momentKeeper": "{count} saved moments",
        "achievement.campusSignal": "{count} received reactions",
        "achievement.topExplorer": "Rank #{rank} on the leaderboard",
        "notification.momentCreated": "You posted a moment",
        "notification.momentUpdated": "You edited a post",
        "notification.reactionReceived": "New reaction received",
        "notification.default": "Notification",
        "notification.momentActivity": "Posted moment: \"{caption}\"",
        "auth.loginTitle": "Sign in",
        "auth.signupTitle": "Sign up",
        "auth.subtitle": "Start your VKU exploration journey",
        "auth.email": "Email",
        "auth.emailPlaceholder": "Enter your email",
        "auth.password": "Password",
        "auth.passwordPlaceholder": "Enter your password",
        "auth.loginAction": "Sign in",
        "auth.signupAction": "Sign up",
        "auth.needAccount": "No account yet?",
        "auth.hasAccount": "Already have an account?",
        "auth.signupNow": "Sign up now",
        "auth.loginNow": "Sign in",
        "auth.loggingIn": "Signing in...",
        "auth.signingUp": "Signing up...",
        "avatar.eyebrow": "Role-play journey",
        "avatar.title": "Choose a representative to start exploring VKU",
        "avatar.body": "Move through each zone, unlock every location, and collect notes about important places across campus.",
        "avatar.nameLabel": "Your character name",
        "avatar.namePlaceholder": "Enter the name you want (for example: Solo Wolf, Imposter...)",
        "avatar.optionsLabel": "Choose representative color/role",
        "avatar.start": "Start journey",
        "avatar.resume": "Resume previous journey",
        "tour.home": "Back home",
        "tour.openRoute": "Open route",
        "tour.openMoments": "Open moments",
        "tour.toggleStage": "Show/hide stage",
        "tour.toggleAudio": "Toggle audio",
        "tour.changeAvatar": "Change avatar",
        "tour.logout": "Sign out",
        "tour.route": "Route",
        "tour.routeHint": "Choose a stage to view",
        "tour.closeRoute": "Close route",
        "tour.representative": "Representative",
        "tour.stageContent": "Location content",
        "tour.notes": "Exploration notes",
        "tour.miniMission": "Mini mission",
        "tour.moments": "Moments",
        "tour.momentsHint": "Photos and reflections at the current stage",
        "tour.closeMoments": "Close moments",
        "tour.postMoment": "Post moment",
        "tour.momentQuestion": "What do you want to save?",
        "tour.momentPlaceholder": "Write one short line about this moment...",
        "tour.mood": "Mood",
        "tour.visibility": "Visibility",
        "tour.private": "Only me",
        "tour.public": "Public in tour",
        "tour.photo": "Moment photo",
        "tour.photoHelp": "Maximum image size is 5MB. When editing, choose a new image to replace the old one.",
        "tour.cancel": "Cancel",
        "tour.saveMoment": "Save moment",
        "tour.mapArea": "Area map",
        "tour.closeMap": "Close map",
        "tour.openMap": "Open map",
        "congrats.title": "Congratulations!",
        "congrats.body": "You have completed the full VKU 360 Quest exploration journey.",
        "congrats.stages": "Completed stages",
        "congrats.companion": "Companion",
        "route.stage": "Stage",
        "route.zoneV": "Zone V",
        "route.zoneK": "Zone K",
        "unit.stage": "stages",
        "unit.pointUnlocked": "points unlocked",
        "unit.post": "posts",
        "fallback.explorer": "Explorer",
        "fallback.guest": "Guest",
        "status.justNow": "Just now",
        "map.title": "{zone} Map",
        "map.alt": "{zone} Map",
        "hotspot.next": "Next: {title}",
        "hotspot.previous": "Back: {title}",
        "toast.firebaseMissing": "Firebase configuration has not been set.",
        "toast.loginSuccess": "Signed in successfully!",
        "toast.signupSuccess": "Signed up successfully!",
        "toast.logoutSuccess": "Signed out.",
        "toast.logoutError": "Sign-out error.",
        "toast.nicknameSet": "Hello, {name}! Let the adventure begin! 🎉",
        "nickname.confirm": "Start journey",
        "nickname.errorMin": "Name must be at least 2 characters",
        "nickname.errorMax": "Name cannot exceed 24 characters",
        "nickname.errorBlank": "Name cannot be only spaces",
        "toast.needLoginAvatar": "You need to sign in to upload an avatar.",
        "toast.avatarUpdated": "Avatar updated.",
        "toast.avatarUploadedUnsynced": "Image uploaded, but profile sync did not complete.",
        "toast.avatarUploadError": "Could not upload avatar. Please try again.",
        "toast.imageOnly": "Only image files are supported.",
        "toast.avatarMax": "Avatar size is limited to 5MB.",
        "toast.restart": "The journey has restarted from the zone V main gate.",
        "toast.viewerMissing": "Could not load the 360 viewer. Tour content is still available.",
        "toast.lockedRoute": "This point is locked. Follow the quest route first.",
        "toast.lockedStep": "This point is locked. Complete the previous stages first.",
        "toast.needLoginMomentPost": "You need to sign in to post a moment.",
        "toast.needLoginMomentSave": "You need to sign in to save a moment.",
        "toast.needCaption": "Please enter a caption for the moment.",
        "toast.momentUpdated": "Moment updated.",
        "toast.momentSaved": "Moment saved.",
        "toast.momentSaveError": "Could not save moment.",
        "toast.needLoginReaction": "You need to sign in to react to a moment.",
        "toast.reactionRemoved": "Reaction removed from the moment.",
        "toast.reactionSaved": "Reaction added to the moment.",
        "toast.reactionError": "Could not add reaction. Please try again.",
        "toast.momentDeleted": "Moment deleted.",
        "toast.momentDeleteError": "Could not delete moment.",
        "toast.momentLoadError": "Could not load moments.",
        "toast.photoMax": "Image size is limited to 5MB.",
        "confirm.deleteMoment": "Delete this moment?",
        "auth.error.emailInUse": "This email is already registered.",
        "auth.error.invalidEmail": "Invalid email.",
        "auth.error.invalidCredential": "Email or password is incorrect.",
        "auth.error.network": "Could not connect to Firebase. Check your network or project configuration.",
        "auth.error.operation": "Email/Password sign-in is not enabled in Firebase Authentication.",
        "auth.error.tooMany": "Too many sign-in attempts. Please wait and try again.",
        "auth.error.missingPassword": "Please enter a password.",
        "auth.error.weakPassword": "Password must be at least 6 characters.",
        "auth.error.userNotFound": "Account not found.",
        "auth.error.wrongPassword": "Incorrect password.",
        "auth.error.default": "An error occurred.",
        "partial.error": "Could not load {partial}",
        "partial.title": "Could not load the interface",
        "partial.hint": "Run the page through a local server instead of opening the HTML file directly.",
        "moments.emptyLogin": "Sign in to save and view moments at this location.",
        "moments.loading": "Loading moments...",
        "moments.empty": "There are no moments at this location yet.",
        "moments.error": "Could not load moments. Please try again later.",
        "moments.previewAlt": "Moment preview image",
        "moments.imageAlt": "Moment photo at {sceneTitle}",
        "moments.like": "Like",
        "moments.love": "Favorite",
        "moments.celebrate": "Celebrate",
        "moments.reactLabel": "React to this moment",
        "moments.publicLabel": "Public",
        "moments.privateLabel": "Only me",
        "moments.edit": "Edit",
        "moments.delete": "Delete",
        "moments.saveLoading": "Saving...",
        "moments.notificationUpdated": "The moment at {sceneTitle} was updated.",
        "moments.notificationCreated": "A new post at {sceneTitle} was saved to the journal.",
        "moments.reactionTitle": "{name} reacted with {reaction}",
        "moments.reactionBody": "The moment \"{caption}\" just received a new interaction.",
        "moments.yourMoment": "your moment",
        "mood.excited": "Excited",
        "mood.impressed": "Impressed",
        "mood.peaceful": "Peaceful",
        "mood.proud": "Proud",
        "guide.title": "VKU Guide",
        "guide.subtitle": "Your campus buddy",
        "guide.placeholder": "Ask me about this stop...",
        "guide.welcome": "Hi hi, I'm VKU Guide. Ask me for directions, a tiny hint, or the next mini mission anytime.",
        "guide.needLogin": "Sign in first so I can guide you properly.",
        "guide.needLoginLong": "Please sign in for a moment, then I'll guide you based on your progress.",
        "guide.noFunctions": "Guide is not connected to Cloud Functions yet, so I can't chat for real right now.",
        "guide.noReply": "I don't have a good answer yet.",
        "guide.error": "My signal is a little stuck. Please try again after the function is deployed."
    }
};

const STATIC_BINDINGS = [
    { selector: 'meta[name="description"]', attr: "content", key: "meta.description" },
    { selector: ".home-nav-links a.active, .home-mobile-menu a.active", key: "nav.dashboard" },
    { selector: ".profile-nav-links [data-back-home]:first-child", key: "nav.dashboard" },
    { selector: '[data-open-page="quest"]', key: "nav.quests" },
    { selector: '[data-open-page="leaderboard"]', key: "nav.leaderboard" },
    { selector: '[data-open-page="library"]', key: "nav.library" },
    { selector: '.home-nav-links [data-open-page="profile"], .home-mobile-menu [data-open-page="profile"], .profile-nav-links [data-open-page="profile"]', key: "nav.profile" },
    { selector: '[data-open-page="events"]', key: "nav.events" },
    { selector: "#quest-screen .profile-nav-links span", key: "nav.quests" },
    { selector: "#leaderboard-screen .profile-nav-links span", key: "nav.leaderboard" },
    { selector: "#library-screen .profile-nav-links span", key: "nav.library" },
    { selector: "#profile-screen .profile-nav-links span", key: "nav.profile" },
    { selector: "#events-screen .profile-nav-links span", key: "nav.events" },
    { selector: ".home-mobile-menu-head strong", key: "nav.controls" },
    { selector: "#home-menu-toggle, .profile-menu-toggle", attr: "aria-label", key: "nav.openMenu" },
    { selector: "#home-menu-close, #home-menu-backdrop", attr: "aria-label", key: "nav.closeMenu" },
    { selector: '[aria-label="Thông báo"], [aria-label="Notifications"]', attr: "aria-label", key: "nav.notifications" },
    { selector: '[aria-label="Tài khoản"], [aria-label="Account"]', attr: "aria-label", key: "nav.account" },
    { selector: "#profile-logout-btn, #tour-logout-btn", attr: "aria-label", key: "nav.logout" },
    { selector: '[aria-label="Settings"]', attr: "aria-label", key: "nav.settings" },
    { selector: '.home-login-button[data-start-tour]', key: "action.map360" },
    { selector: ".home-hero-actions .home-primary", html: 'Get Started <i class="ph ph-arrow-right"></i>', key: "action.getStarted" },
    { selector: ".standalone-page-hero .home-primary", html: 'Start tour <i class="ph ph-arrow-right"></i>', key: "action.startTour" },
    { selector: ".home-hero-actions .home-secondary", html: 'View Leaderboard <i class="ph ph-trophy"></i>', key: "action.viewLeaderboard" },
    { selector: ".live-pill", html: '<span></span> VKU 360 Quest Now Live', key: "home.live" },
    { selector: ".home-hero h1", html: 'Explore the VKU Campus <span>Like Never Before</span>', key: "home.heroTitle", accentKey: "home.heroAccent" },
    { selector: ".home-hero-copy > p", key: "home.heroBody" },
    { selector: ".home-hero-visual", attr: "aria-label", value: "VKU campus preview" },
    { selector: ".home-hero-visual img", attr: "alt", key: "home.previewAlt" },
    { selector: ".card-one span", key: "home.cardActiveLabel" },
    { selector: ".card-one strong", key: "home.cardActiveTitle" },
    { selector: ".card-two span", key: "home.cardProgressLabel" },
    { selector: ".card-two strong", key: "home.cardProgressTitle" },
    { selector: "#home-features .section-heading h2", key: "home.featuresTitle" },
    { selector: "#home-features .section-heading p", key: "home.featuresBody" },
    { selector: ".feature-card:nth-child(1) h3", key: "home.featureMapTitle" },
    { selector: ".feature-card:nth-child(1) p", key: "home.featureMapBody" },
    { selector: ".feature-card:nth-child(2) h3", key: "home.featureAchievementTitle" },
    { selector: ".feature-card:nth-child(2) p", key: "home.featureAchievementBody" },
    { selector: ".feature-card:nth-child(3) h3", key: "home.featureRankingTitle" },
    { selector: ".feature-card:nth-child(3) p", key: "home.featureRankingBody" },
    { selector: ".feature-quest h3", key: "home.featureQuestTitle" },
    { selector: ".feature-quest p", key: "home.featureQuestBody" },
    { selector: ".quest-preview span", html: '<i class="ph ph-check-circle"></i> Library Tour Complete', key: "home.featureQuestPreview" },
    { selector: ".home-footer > span", key: "home.footerRights" },
    { selector: ".home-footer a:nth-child(1)", key: "home.privacy" },
    { selector: ".home-footer a:nth-child(2)", key: "home.terms" },
    { selector: ".home-footer a:nth-child(3)", key: "home.directory" },
    { selector: ".home-footer a:nth-child(4)", key: "home.contact" },
    { selector: "#quest-screen .standalone-page-kicker", key: "quest.kicker" },
    { selector: "#quest-screen .standalone-page-hero h1", key: "quest.title" },
    { selector: "#quest-screen .standalone-page-hero p", key: "quest.body" },
    { selector: "#leaderboard-screen .standalone-page-kicker", key: "leaderboard.kicker" },
    { selector: "#leaderboard-screen .standalone-page-hero h1", key: "leaderboard.title" },
    { selector: "#leaderboard-screen .standalone-page-hero p", key: "leaderboard.body" },
    { selector: "#library-screen .standalone-page-kicker", key: "library.kicker" },
    { selector: "#library-screen .standalone-page-hero h1", key: "library.title" },
    { selector: "#library-screen .standalone-page-hero p", key: "library.body" },
    { selector: "#events-screen .standalone-page-kicker", key: "events.kicker" },
    { selector: "#events-screen .standalone-page-hero h1", key: "events.title" },
    { selector: "#events-screen .standalone-page-hero p", key: "events.body" },
    { selector: ".event-form-head span", key: "events.album" },
    { selector: ".event-form-head h2", key: "events.formTitle" },
    { selector: "#event-photo-submit", html: '<i class="ph ph-cloud-arrow-up"></i> Đăng ảnh', key: "events.postPhoto" },
    { selector: 'label[for="event-photo-title"]', key: "events.eventName" },
    { selector: "#event-photo-title", attr: "placeholder", key: "events.eventNamePlaceholder" },
    { selector: 'label[for="event-photo-file"]:not(.event-file-button)', key: "events.photo" },
    { selector: ".event-file-button span", key: "events.choosePhoto" },
    { selector: "#event-photo-file-name", key: "events.noFileSelected" },
    { selector: ".event-file-control small", key: "events.photoHelp" },
    { selector: 'label[for="event-photo-caption"]', key: "events.caption" },
    { selector: "#event-photo-caption", attr: "placeholder", key: "events.captionPlaceholder" },
    { selector: ".events-gallery-section .profile-section-title h2", key: "events.galleryTitle" },
    { selector: ".profile-badges span:first-child", key: "profile.badge" },
    { selector: ".profile-progress-row > div:first-child > span", key: "profile.xpProgress" },
    { selector: ".profile-stat-grid article:nth-child(1) > span", key: "profile.questsDone" },
    { selector: ".profile-stat-grid article:nth-child(2) > span", key: "profile.totalXp" },
    { selector: ".profile-stat-grid article:nth-child(3) > span", key: "profile.ranking" },
    { selector: ".profile-stat-grid article:nth-child(4) > span", key: "profile.moments" },
    { selector: ".profile-achievements-wrap .profile-section-title h2", key: "profile.achievements" },
    { selector: ".profile-achievements-wrap .profile-section-title button", html: 'View All <i class="ph ph-arrow-right"></i>', key: "action.viewAll" },
    { selector: ".profile-activity-wrap .profile-section-title h2", key: "profile.activity" },
    { selector: "#upload-profile-avatar", html: '<i class="ph ph-camera"></i> Upload avatar', key: "action.uploadAvatar" },
    { selector: "#auth-title", key: "auth.loginTitle" },
    { selector: "#auth-subtitle", key: "auth.subtitle" },
    { selector: 'label[for="email"]', key: "auth.email" },
    { selector: "#email", attr: "placeholder", key: "auth.emailPlaceholder" },
    { selector: 'label[for="password"]', key: "auth.password" },
    { selector: "#password", attr: "placeholder", key: "auth.passwordPlaceholder" },
    { selector: ".intro-copy .eyebrow", key: "avatar.eyebrow" },
    { selector: ".intro-copy h1", key: "avatar.title" },
    { selector: ".intro-copy > p:last-child", key: "avatar.body" },
    { selector: 'label[for="custom-avatar-name"]', key: "avatar.nameLabel" },
    { selector: "#custom-avatar-name", attr: "placeholder", key: "avatar.namePlaceholder" },
    { selector: "#avatar-options", attr: "aria-label", key: "avatar.optionsLabel" },
    { selector: "#start-new-tour-btn", html: 'Bắt đầu hành trình <i class="ph ph-arrow-right"></i>', key: "avatar.start" },
    { selector: "#resume-tour", html: '<i class="ph ph-play-circle"></i> Tiếp tục hành trình trước', key: "avatar.resume" },
    { selector: '[aria-label="Về trang chủ"], [aria-label="Back home"]', attr: "aria-label", key: "tour.home" },
    { selector: "#toggle-quest-sidebar", attr: "aria-label", key: "tour.openRoute" },
    { selector: "#toggle-moments-page", attr: "aria-label", key: "tour.openMoments" },
    { selector: "#toggle-story-sidebar", attr: "aria-label", key: "tour.toggleStage" },
    { selector: "#toggle-audio", attr: "aria-label", key: "tour.toggleAudio" },
    { selector: "#change-avatar", attr: "aria-label", key: "tour.changeAvatar" },
    { selector: "#restart-tour", attr: "aria-label", key: "action.restart" },
    { selector: "#logout-btn", attr: "aria-label", key: "tour.logout" },
    { selector: ".route-panel-head strong", key: "tour.route" },
    { selector: ".route-panel-head span", key: "tour.routeHint" },
    { selector: "#close-route-page-btn", attr: "aria-label", key: "tour.closeRoute" },
    { selector: ".profile-card > div:last-child > span:first-child", key: "tour.representative" },
    { selector: ".story-panel", attr: "aria-label", key: "tour.stageContent" },
    { selector: ".intel-block h3", key: "tour.notes" },
    { selector: ".mission-block span", key: "tour.miniMission" },
    { selector: "#prev-step", html: '<i class="ph ph-arrow-left"></i> Quay lại', key: "action.back" },
    { selector: ".moments-panel", attr: "aria-label", key: "tour.moments" },
    { selector: ".moments-panel-head strong", key: "tour.moments" },
    { selector: ".moments-panel-head span", key: "tour.momentsHint" },
    { selector: "#close-moments-page-btn", attr: "aria-label", key: "tour.closeMoments" },
    { selector: ".moments-head > div > span", key: "tour.moments" },
    { selector: "#open-moment-form", html: '<i class="ph ph-camera"></i> Đăng khoảnh khắc', key: "tour.postMoment" },
    { selector: 'label[for="moment-caption"]', key: "tour.momentQuestion" },
    { selector: "#moment-caption", attr: "placeholder", key: "tour.momentPlaceholder" },
    { selector: 'label[for="moment-mood"]', key: "tour.mood" },
    { selector: 'label[for="moment-visibility"]', key: "tour.visibility" },
    { selector: '#moment-visibility option[value="private"]', key: "tour.private" },
    { selector: '#moment-visibility option[value="public"]', key: "tour.public" },
    { selector: 'label[for="moment-photo"]', key: "tour.photo" },
    { selector: ".moment-field small", key: "tour.photoHelp" },
    { selector: "#cancel-moment", key: "tour.cancel" },
    { selector: "#save-moment", html: '<i class="ph ph-floppy-disk"></i> Lưu khoảnh khắc', key: "tour.saveMoment" },
    { selector: ".minimap-panel", attr: "aria-label", key: "tour.mapArea" },
    { selector: "#close-minimap-btn", attr: "aria-label", key: "tour.closeMap" },
    { selector: "#mobile-minimap-btn", attr: "aria-label", key: "tour.openMap" },
    { selector: "#congrats-screen h2", key: "congrats.title" },
    { selector: "#congrats-screen p", key: "congrats.body" },
    { selector: ".congrats-stats .stat-item:nth-child(1) .stat-label", key: "congrats.stages" },
    { selector: ".congrats-stats .stat-item:nth-child(2) .stat-label", key: "congrats.companion" },
    { selector: "#review-tour-btn", html: '<i class="ph ph-map-trifold"></i> Xem lại hành trình', key: "action.reviewTour" },
    { selector: "#restart-tour-btn-congrats", html: '<i class="ph ph-arrow-counter-clockwise"></i> Chơi lại từ đầu', key: "action.restart" }
];

const AVATAR_EN = {
    "tan-sinh-vien": {
        role: "New student",
        line: "I will note every important stop so the first day on campus is easy to navigate."
    },
    "nha-tham-hiem": {
        role: "Explorer",
        line: "I will follow the route and unlock each zone like a mission map."
    },
    "huong-dan-vien": {
        role: "Guide",
        line: "I will connect every location with its story and purpose."
    },
    "ky-su-tre": {
        role: "Young engineer",
        line: "I will pay attention to learning, practice, and student-life spaces."
    }
};

const ROUTE_EN = {
    "v-cong-chinh": {
        title: "Zone V Main Gate",
        shortTitle: "Main Gate",
        reward: "+10 orientation",
        body: "This is the starting point of the journey. From the main gate, learners begin to understand how functional areas in zone V connect.",
        notes: [
            "The first landmark when entering zone V.",
            "Useful as an orientation or group meeting point.",
            "From here, the route can continue to the main lecture halls."
        ],
        mission: "Identify the direction to lecture halls A and B before moving to the next stop.",
        dialog: "I am inside zone V. First, remember the gate, the main movement axis, and the nearest lecture halls."
    },
    "v-va": {
        title: "Lecture Hall A (VA)",
        shortTitle: "Lecture Hall A",
        reward: "+10 learning",
        body: "Lecture Hall A is an important learning point in the zone V route. This stop helps viewers understand classrooms, schedules, and room orientation.",
        notes: [
            "Add real photos or short videos of corridors and classrooms when available.",
            "Room-finding tips by floor or code would be helpful.",
            "A strong stop for everyday student orientation."
        ],
        mission: "Remember the VA code and its position relative to the main gate.",
        dialog: "The first academic area is unlocked. If someone has class at VA, they need to know how to get there from the gate."
    },
    "v-vb": {
        title: "Lecture Hall B (VB)",
        shortTitle: "Lecture Hall B",
        reward: "+10 positioning",
        body: "Lecture Hall B completes the pair of main academic stops in zone V. This stage should clarify how VA and VB differ.",
        notes: [
            "Add classroom, lab, or corridor information when available.",
            "Use real exterior photos so viewers can recognize the building.",
            "This stop creates a transition before finishing zone V."
        ],
        mission: "Compare VB with VA on the mini map.",
        dialog: "Now I have both major academic landmarks in zone V. The last stop in this zone is a support area."
    },
    "v-bai-do-xe": {
        title: "Staff Parking Area (Zone V)",
        shortTitle: "Parking Area",
        reward: "+10 utility",
        body: "A useful tour includes more than main buildings. Utility points show how the campus works in daily life.",
        notes: [
            "Clarify who the area is intended for to avoid confusion.",
            "Add notes about vehicle flow, walking paths, and safe points.",
            "Finish zone V before unlocking zone K."
        ],
        mission: "Complete zone V notes and prepare to move to zone K.",
        dialog: "Zone V is complete. I now have the gate, lecture halls, and essential utilities before moving to zone K."
    },
    "k-hanh-chinh": {
        title: "Administration Center",
        shortTitle: "Administration",
        reward: "+15 new zone",
        body: "Zone K opens the broader part of the journey. The Administration Center is a strong anchor for explaining student services and procedures.",
        notes: [
            "Add common departments that students need to find.",
            "Office hours or procedure links would be useful.",
            "This is an important transition toward the auditorium and central area."
        ],
        mission: "Unlock zone K by locating the Administration Center on the map.",
        dialog: "Zone K is open. I will use the Administration Center as the anchor for the remaining stops."
    },
    "k-hoi-truong": {
        title: "Round Auditorium",
        shortTitle: "Auditorium",
        reward: "+10 events",
        body: "The auditorium is where the tour can tell stories about events, community activities, and major student moments.",
        notes: [
            "Highlight ceremonies, seminars, student meetings, and major programs.",
            "Interior photos can make the stop feel more immersive.",
            "This location adds community energy to the tour."
        ],
        mission: "Record one typical activity that could happen at the auditorium.",
        dialog: "This place should feel energetic. Viewers need to see that it is more than just a building."
    },
    "k-thu-vien": {
        title: "eSTI Institute & Library",
        shortTitle: "Library",
        reward: "+10 knowledge",
        body: "This stop should become a knowledge station: group study, documents, research, and self-study spaces.",
        notes: [
            "Add photos of reading areas, computers, or study rooms.",
            "Show usage rules or opening hours when available.",
            "Good for a resource-finding or group-study mission."
        ],
        mission: "Find the connection point from the library to lecture hall A.",
        dialog: "A role-play tour needs a stop that explains academic life beyond the classroom."
    },
    "k-f": {
        title: "Student Center (F)",
        shortTitle: "Student Center",
        reward: "+10 student life",
        body: "The Student Center can tell stories about activities, support services, and life outside class.",
        notes: [
            "Clarify what students come here to do.",
            "Add club activities or student services.",
            "This stop balances academic and student-life experiences."
        ],
        mission: "Remember the F code and its relationship with the Administration Center.",
        dialog: "Passing by buildings without context is not enough. This stop should explain student-life rhythm."
    },
    "k-d1-d2": {
        title: "Departments and Offices (D1, D2)",
        shortTitle: "D1, D2",
        reward: "+10 academic support",
        body: "D1 and D2 are useful for introducing departments, specialized offices, or student contact points during study.",
        notes: [
            "List notable departments or offices by building when data is available.",
            "Include common room-location information.",
            "This stop should be clear and easy to scan."
        ],
        mission: "Find one important department or office and write it into the exploration log.",
        dialog: "This section needs practical information. Viewers should leave with a clear landmark."
    },
    "k-d1-t1-khmt": {
        title: "D1 Floor 1 - Computer Science Faculty",
        shortTitle: "Floor 1: CS",
        reward: "+10 knowledge",
        body: "Welcome to the Computer Science faculty on floor 1 of D1. This is where software and algorithm specialists begin their path.",
        notes: [
            "Faculty office and foundational practice rooms.",
            "A place to ask about the Computer Science learning roadmap.",
            "A destination for learners interested in programming and AI."
        ],
        mission: "Locate the Computer Science faculty office.",
        dialog: "Floor 1 is the home base of Computer Science. Many software journeys start here."
    },
    "k-d1-t2-ktmt": {
        title: "D1 Floor 2 - Computer Engineering Faculty",
        shortTitle: "Floor 2: CE",
        reward: "+10 engineering",
        body: "Floor 2 belongs to Computer Engineering and Electronics, where hardware and software connect.",
        notes: [
            "Embedded systems and microchip lab areas.",
            "Research spaces for IoT, robotics, and computer hardware.",
            "A creative space for connected-device ideas."
        ],
        mission: "Learn about IoT labs on floor 2.",
        dialog: "On floor 2, we enter the world of hardware and embedded systems."
    },
    "k-d1-t3-kts-tmdt": {
        title: "D1 Floor 3 - Digital Economy & E-commerce",
        shortTitle: "Floor 3: DE",
        reward: "+10 digital economy",
        body: "Floor 3 is for Digital Economy and E-commerce, connecting technology with modern business models.",
        notes: [
            "Faculty offices and digital economy seminar rooms.",
            "A place for startups and platform-based business ideas.",
            "Focused on business analytics and digital marketing."
        ],
        mission: "Explore the seminar room on floor 3.",
        dialog: "The top floor of D1 is where technology meets business in the Digital Economy faculty."
    },
    "k-e": {
        title: "Centers, Offices & Lecture Halls (E)",
        shortTitle: "Zone E",
        reward: "+10 connection",
        body: "Zone E combines learning, offices, and functional centers. Content should help viewers understand each area clearly.",
        notes: [
            "Separate offices, centers, and lecture halls when real data is available.",
            "Add labels by floor or area.",
            "This stop sits on the route back toward the center of zone K."
        ],
        mission: "Identify the way back to D1/D2 and the next route toward the center.",
        dialog: "I am entering a denser functional cluster. This content should be broken into small, memorable pieces."
    },
    "k-a": {
        title: "Lecture Hall A",
        shortTitle: "Lecture Hall A",
        reward: "+10 classrooms",
        body: "Lecture Hall A in zone K begins the central classroom cluster. This content should stay close to daily class routines.",
        notes: [
            "Add classroom, corridor, and building-sign photos.",
            "Include room-finding tips or the route from the library.",
            "This is the first stop in the A-B-C cluster."
        ],
        mission: "Follow the route from lecture hall A to B and the fountain.",
        dialog: "Now we are in the lecture-hall cluster. The tour should keep a quick rhythm so viewers stay oriented."
    },
    "k-b": {
        title: "Lecture Hall B",
        shortTitle: "Lecture Hall B",
        reward: "+10 classrooms",
        body: "Lecture Hall B continues the academic cluster. The content should show the A-B-C route instead of isolated buildings.",
        notes: [
            "Show directions toward lecture halls A and C.",
            "Add exterior recognition photos.",
            "This stop is useful for learning how to read the zone K map."
        ],
        mission: "Identify the direction toward lecture hall C.",
        dialog: "A and B are connected. I will move to C to complete this cluster."
    },
    "k-c": {
        title: "Lecture Hall C",
        shortTitle: "Lecture Hall C",
        reward: "+10 cluster completion",
        body: "Lecture Hall C completes the A-B-C academic cluster. This is a good place to summarize the learning route in zone K.",
        notes: [
            "Add a short summary of the A-B-C cluster.",
            "Show tips for moving back toward the center of zone K.",
            "The next stop should be an easy visual landmark."
        ],
        mission: "Summarize the A-B-C cluster before moving to the fountain.",
        dialog: "The lecture-hall cluster is complete. The next landmark should be the easiest point to remember on the map."
    },
    "k-dai-phun-nuoc": {
        title: "Fountain",
        shortTitle: "Fountain",
        reward: "+10 central landmark",
        body: "The fountain is a strong visual landmark for self-orientation. This stop can act as a rest point in the middle of the journey.",
        notes: [
            "Use real photos because this is easy to remember.",
            "Add a strong 360 view to create a highlight.",
            "From here, the route can branch toward sports areas or functional clusters."
        ],
        mission: "Use the fountain as the landmark for finding the sports area.",
        dialog: "This is the central landmark. If viewers remember it, the whole zone K map becomes easier to understand."
    },
    "k-the-thao": {
        title: "Sports Area",
        shortTitle: "Sports",
        reward: "+10 energy",
        body: "The sports area moves the journey beyond classrooms and offices, helping the campus feel more alive.",
        notes: [
            "Add information about courts, gym areas, or sports activities.",
            "Connect this stop with clubs or student events.",
            "This stop naturally leads toward the football field."
        ],
        mission: "Find the route from the sports area to the football field.",
        dialog: "After many academic stops, this section gives the tour more breathing room. Continue to the football field."
    },
    "k-san-bong": {
        title: "Football / Athletics Field",
        shortTitle: "Football Field",
        reward: "+10 activities",
        body: "The football and athletics field represents after-class activities, competitions, and team spirit.",
        notes: [
            "Add a wide field photo to create an open feeling.",
            "Include physical activities or student tournaments.",
            "This stop is close to the route toward the dormitory."
        ],
        mission: "Observe the field position relative to the dormitory area.",
        dialog: "This is where student energy shows up. The final stop will be a long-term living space."
    },
    "k-ktx": {
        title: "Dormitory Area",
        shortTitle: "Dormitory",
        reward: "+20 completion",
        body: "The dormitory is a fitting final stop because it connects learning with daily life. It should include practical information for new students.",
        notes: [
            "Add room, registration, rules, and nearby utility information.",
            "Use this stop to end with a summary of the full journey.",
            "Complete the route from zone V to zone K."
        ],
        mission: "Complete the exploration log and review the unlocked stops.",
        dialog: "The journey has made a full loop. Viewers can now return to any unlocked point."
    }
};

const COMPACT_ROUTE_FIELDS = new Set(["body", "notes", "mission", "dialog"]);

export function getCurrentLanguage() {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : "vi";
}

export function getCurrentLocale() {
    return getCurrentLanguage() === "en" ? "en-US" : "vi-VN";
}

function setLanguage(language) {
    const nextLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : "vi";
    localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    applyTranslations();
    window.dispatchEvent(new CustomEvent("vku-language-change", { detail: { language: nextLanguage } }));
}

export function translate(key, params = {}) {
    const language = getCurrentLanguage();
    const template = TEXT[language]?.[key] ?? TEXT.vi[key] ?? key;
    return Object.entries(params).reduce((value, [name, replacement]) => {
        return value.replaceAll(`{${name}}`, String(replacement));
    }, template);
}

export function formatNumber(value) {
    return Number(value).toLocaleString(getCurrentLocale());
}

export function mountLanguageSwitchers() {
    const targets = [
        ".home-nav-actions",
        ".profile-nav-actions",
        ".topbar-actions",
        ".auth-container"
    ];

    targets.forEach((selector) => {
        document.querySelectorAll(selector).forEach((target, index) => {
            if (target.querySelector(".language-switcher")) return;

            const switcher = document.createElement("div");
            switcher.className = "language-switcher";
            switcher.setAttribute("role", "group");
            switcher.setAttribute("aria-label", translate("lang.label"));
            switcher.innerHTML = `
                <button type="button" data-language-option="vi">VI</button>
                <button type="button" data-language-option="en">EN</button>
            `;

            if (selector === ".auth-container") {
                switcher.classList.add("auth-language-switcher");
                target.insertBefore(switcher, target.firstElementChild);
            } else if (selector === ".topbar-actions" && index > 0) {
                return;
            } else {
                target.insertBefore(switcher, target.firstElementChild);
            }
        });
    });

    document.querySelectorAll("[data-language-option]").forEach((button) => {
        button.addEventListener("click", () => setLanguage(button.dataset.languageOption));
    });
    syncLanguageSwitchers();
}

export function applyTranslations() {
    document.documentElement.lang = getCurrentLanguage();
    STATIC_BINDINGS.forEach((binding) => {
        document.querySelectorAll(binding.selector).forEach((element) => {
            const value = binding.value ?? translate(binding.key);

            if (binding.selector === ".home-hero h1") {
                element.innerHTML = `${translate(binding.key)} <span>${translate(binding.accentKey)}</span>`;
                return;
            }

            if (binding.selector === ".live-pill") {
                element.innerHTML = `<span></span> ${value}`;
                return;
            }

            if (binding.html) {
                element.innerHTML = translateIconHtml(binding.html, value);
                return;
            }

            if (binding.attr) {
                element.setAttribute(binding.attr, value);
                return;
            }

            element.textContent = value;
        });
    });

    syncMoodOptions();
    syncLanguageSwitchers();
}

export function getSceneText(scene, field) {
    if (!scene) return "";
    const language = getCurrentLanguage();
    if (COMPACT_ROUTE_FIELDS.has(field)) {
        return getCompactSceneText(scene, field, language);
    }

    if (language === "vi") return scene[field];

    if (field === "chapter") {
        return `${translate("route.stage")} ${getStageNumber(scene)}`;
    }

    if (field === "zoneName") {
        return scene.zone === "khu-v" ? translate("route.zoneV") : translate("route.zoneK");
    }

    return ROUTE_EN[scene.id]?.[field] ?? scene[field];
}

function getCompactSceneText(scene, field, language) {
    const title = language === "en"
        ? (ROUTE_EN[scene.id]?.title || scene.title)
        : scene.title;
    const shortTitle = language === "en"
        ? (ROUTE_EN[scene.id]?.shortTitle || title)
        : (scene.shortTitle || scene.title);

    if (language === "en") {
        const compact = {
            body: `${title} is a key stop on the campus route. Observe its position and remember the next direction.`,
            notes: [
                "Identify this stop on the map.",
                "Remember the route to the next point."
            ],
            mission: `Locate ${shortTitle} on the map and continue when ready.`,
            dialog: `We are at ${shortTitle}. Note the landmark and move on.`
        };
        return compact[field];
    }

    const compact = {
        body: `${title} là một mốc chính trong tuyến tham quan. Hãy quan sát vị trí và ghi nhớ hướng đi tiếp theo.`,
        notes: [
            "Xác định mốc này trên bản đồ.",
            "Ghi nhớ lối đi sang điểm kế tiếp."
        ],
        mission: `Tìm ${shortTitle} trên bản đồ rồi tiếp tục khi đã sẵn sàng.`,
        dialog: `Đã đến ${shortTitle}. Ghi nhớ mốc này rồi đi tiếp.`
    };
    return compact[field];
}

export function getAvatarText(avatar, field) {
    if (!avatar) return "";
    if (getCurrentLanguage() === "vi") return avatar[field];
    return AVATAR_EN[avatar.id]?.[field] ?? avatar[field];
}

export function getZoneName(zone) {
    return zone === "khu-v" ? translate("route.zoneV") : translate("route.zoneK");
}

function syncLanguageSwitchers() {
    const language = getCurrentLanguage();
    document.querySelectorAll(".language-switcher").forEach((switcher) => {
        switcher.setAttribute("aria-label", translate("lang.label"));
    });
    document.querySelectorAll("[data-language-option]").forEach((button) => {
        const isActive = button.dataset.languageOption === language;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
        button.textContent = translate(`lang.${button.dataset.languageOption}`);
    });
}

function syncMoodOptions() {
    const moodMap = {
        "Hào hứng": "mood.excited",
        "Ấn tượng": "mood.impressed",
        "Bình yên": "mood.peaceful",
        "Tự hào": "mood.proud"
    };

    document.querySelectorAll("#moment-mood option").forEach((option) => {
        const key = moodMap[option.value];
        if (key) option.textContent = translate(key);
    });
}

function translateIconHtml(html, value) {
    if (!html.includes("<i")) return value;
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const icon = template.content.querySelector("i")?.outerHTML || "";
    return html.trim().startsWith("<i") ? `${icon} ${value}` : `${value} ${icon}`;
}

function getStageNumber(scene) {
    const match = String(scene.chapter || "").match(/\d+/);
    return match ? match[0] : "";
}
