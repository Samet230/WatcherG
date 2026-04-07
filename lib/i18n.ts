import type { NewsCategory } from "@/types/pin";

export const APP_LANGUAGES = ["tr", "en", "es", "fr", "de", "ar", "ru"] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

export interface LanguageOption {
    code: AppLanguage;
    label: string;
    nativeLabel: string;
    dir: "ltr" | "rtl";
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
    { code: "tr", label: "Turkish", nativeLabel: "Turkce", dir: "ltr" },
    { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
    { code: "es", label: "Spanish", nativeLabel: "Espanol", dir: "ltr" },
    { code: "fr", label: "French", nativeLabel: "Francais", dir: "ltr" },
    { code: "de", label: "German", nativeLabel: "Deutsch", dir: "ltr" },
    { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
    { code: "ru", label: "Russian", nativeLabel: "Русский", dir: "ltr" },
];

export type TranslationKey =
    | "language"
    | "language_selector"
    | "guest_mode"
    | "search_placeholder"
    | "search_results_none_title"
    | "search_results_none_body"
    | "search_results_none_hint"
    | "search_disabled_message"
    | "search_disabled_short"
    | "profile"
    | "login"
    | "logout"
    | "back"
    | "profile_settings"
    | "email"
    | "interests"
    | "interests_desc"
    | "watchlist"
    | "watchlist_desc"
    | "search_country_city"
    | "add"
    | "empty_watchlist"
    | "default_scope"
    | "default_scope_desc"
    | "save"
    | "saved"
    | "save_failed"
    | "language_settings"
    | "language_settings_desc"
    | "guest_notice"
    | "live_feed"
    | "last_sync"
    | "open_source"
    | "waiting_feed"
    | "critical"
    | "total"
    | "sources"
    | "peak"
    | "mapped"
    | "high_priority"
    | "major_updates"
    | "affected_regions"
    | "system_status"
    | "activity_log"
    | "no_live_records"
    | "no_regions_yet"
    | "media_archive"
    | "sources_panel"
    | "events"
    | "categories"
    | "view"
    | "close"
    | "detail"
    | "flow"
    | "timeline"
    | "register_required"
    | "register_required_short"
    | "guest_language_note"
    | "world"
    | "continent"
    | "country"
    | "city"
    | "source_switch"
    | "source"
    | "previous"
    | "next"
    | "no_alt_source"
    | "starred"
    | "star_event"
    | "go_to_source"
    | "unreliable"
    | "suspicious"
    | "reliable"
    | "official_source"
    | "reliability"
    | "location"
    | "alt_sources"
    | "collapse_summary"
    | "expand_news"
    | "time_just_now"
    | "time_minutes_ago"
    | "time_hours_ago"
    | "time_days_ago"
    | "event_time"
    | "score";

const baseTranslations: Record<TranslationKey, string> = {
    language: "Dil",
    language_selector: "Dil Secici",
    guest_mode: "MISAFIR MODU",
    search_placeholder: "Ara... (or: Turkiye depremleri, son dakika)",
    search_results_none_title: "SORGU SONUCU",
    search_results_none_body: "icin sonuc bulunamadi",
    search_results_none_hint: "Farkli kelimeler deneyin veya aramayi temizleyin",
    search_disabled_message: "Arama, bildirim, zaman cizelgesi ve yildizlama icin kayit olman gerekiyor.",
    search_disabled_short: "Arama devre disi",
    profile: "PROFIL",
    login: "GIRIS",
    logout: "Cikis Yap",
    back: "Geri",
    profile_settings: "Profil ve Ayarlar",
    email: "E-posta",
    interests: "Ilgi Alanlari",
    interests_desc: "Takip etmek istediginiz kategorileri secin",
    watchlist: "Takip Listesi",
    watchlist_desc: "Ulke veya sehir arayip ekleyin (maks. 10)",
    search_country_city: "Ulke veya sehir ara...",
    add: "Ekle",
    empty_watchlist: "Henuz takip listesine bolge eklenmedi",
    default_scope: "Varsayilan Kapsam",
    default_scope_desc: "Harita acilinca gosterilecek varsayilan bolge",
    save: "Kaydet",
    saved: "Kaydedildi",
    save_failed: "Kaydetme basarisiz",
    language_settings: "Dil ve Lokalizasyon",
    language_settings_desc: "Tum sistem dili ve haber tercihleri",
    guest_notice: "Misafir kullanici da dil secimini kullanabilir.",
    live_feed: "LIVE_FEED",
    last_sync: "LAST_SYNC",
    open_source: "OPEN_SOURCE",
    waiting_feed: "Canli akis icin veri bekleniyor.",
    critical: "CRITICAL",
    total: "TOTAL",
    sources: "SOURCES",
    peak: "PEAK",
    mapped: "MAPPED",
    high_priority: "HIGH_PRIO",
    major_updates: "ONEMLI GELISMELER",
    affected_regions: "ETKILENEN BOLGELER",
    system_status: "SYSTEM_STATUS",
    activity_log: "24H_ACTIVITY_LOG",
    no_live_records: "Goruntulenecek canli kayit yok.",
    no_regions_yet: "Bolge dagilimi henuz olusmadi.",
    media_archive: "MEDIA_&_ARCHIVE",
    sources_panel: "SOURCES",
    events: "EVENTS",
    categories: "CATEGORIES",
    view: "VIEW",
    close: "Kapat",
    detail: "DETAY",
    flow: "AKIS",
    timeline: "Zaman Cizelgesi",
    register_required: "Kayit olarak daha fazla ozellik acabilirsiniz.",
    register_required_short: "Kayit gerekiyor",
    guest_language_note: "Dil secimi misafir modunda da kaydedilir.",
    world: "Dunya",
    continent: "Kita",
    country: "Ulke",
    city: "Sehir",
    source_switch: "Kaynak Gecisi",
    source: "Kaynak",
    previous: "Onceki",
    next: "Sonraki",
    no_alt_source: "Bu haber icin alternatif kaynak bulunamadi",
    starred: "Olay Yildizli",
    star_event: "Olayi Yildizla",
    go_to_source: "Kaynaga Git",
    unreliable: "Guvenilmez",
    suspicious: "Supheli",
    reliable: "Guvenilir",
    official_source: "Resmi",
    reliability: "Guvenilirlik",
    location: "Konum",
    alt_sources: "Alternatif Kaynaklar",
    collapse_summary: "Ozeti Daralt",
    expand_news: "Haberi Ac",
    time_just_now: "Az once",
    time_minutes_ago: "dk once",
    time_hours_ago: "saat once",
    time_days_ago: "gun once",
    event_time: "Olay Zamani",
    score: "Skor",
};

const TRANSLATIONS: Record<AppLanguage, Record<TranslationKey, string>> = {
    tr: baseTranslations,
    en: {
        ...baseTranslations,
        language: "Language",
        language_selector: "Language Selector",
        guest_mode: "GUEST MODE",
        search_placeholder: "Search... (ex: Turkey earthquakes, breaking news)",
        search_results_none_title: "QUERY RESULT",
        search_results_none_body: "returned no results",
        search_results_none_hint: "Try different keywords or clear the search",
        search_disabled_message: "Register to unlock search, notifications, timeline and starring.",
        search_disabled_short: "Search disabled",
        profile: "PROFILE",
        login: "LOGIN",
        logout: "Sign Out",
        back: "Back",
        profile_settings: "Profile and Settings",
        interests: "Interests",
        interests_desc: "Choose the categories you want to follow",
        watchlist: "Watchlist",
        watchlist_desc: "Search and add countries or cities (max 10)",
        search_country_city: "Search country or city...",
        add: "Add",
        empty_watchlist: "No region has been added yet",
        default_scope: "Default Scope",
        default_scope_desc: "Default region shown when the map loads",
        save: "Save",
        saved: "Saved",
        save_failed: "Save failed",
        language_settings: "Language and Localization",
        language_settings_desc: "Global UI language and news preference",
        guest_notice: "Guest users can use language selection too.",
        waiting_feed: "Waiting for live feed data.",
        major_updates: "MAJOR UPDATES",
        affected_regions: "AFFECTED REGIONS",
        no_live_records: "No live records to display.",
        no_regions_yet: "Region distribution has not formed yet.",
        close: "Close",
        flow: "FLOW",
        timeline: "Timeline",
        register_required: "Register to unlock more features.",
        register_required_short: "Registration required",
        guest_language_note: "Language selection is saved in guest mode too.",
        world: "World",
        continent: "Continent",
        country: "Country",
        city: "City",
        source_switch: "Source Switch",
        source: "Source",
        previous: "Previous",
        next: "Next",
        no_alt_source: "No alternative source found for this article",
        starred: "Event Starred",
        star_event: "Star Event",
        go_to_source: "Go to Source",
        unreliable: "Unreliable",
        suspicious: "Suspicious",
        reliable: "Reliable",
        official_source: "Official",
        reliability: "Reliability",
        location: "Location",
        alt_sources: "Alternative Sources",
        collapse_summary: "Collapse Summary",
        expand_news: "Read More",
        time_just_now: "Just now",
        time_minutes_ago: "min ago",
        time_hours_ago: "hours ago",
        time_days_ago: "days ago",
        event_time: "Event Time",
        score: "Score",
    },
    es: {
        ...baseTranslations,
        language: "Idioma",
        language_selector: "Selector de idioma",
        guest_mode: "MODO INVITADO",
        search_placeholder: "Buscar... (ej: terremotos en Turquia, ultima hora)",
        search_results_none_title: "RESULTADO DE BUSQUEDA",
        search_results_none_body: "no devolvio resultados",
        search_results_none_hint: "Prueba otras palabras o limpia la busqueda",
        search_disabled_message: "Registrate para desbloquear busqueda, alertas, linea de tiempo y favoritos.",
        search_disabled_short: "Busqueda desactivada",
        profile: "PERFIL",
        login: "INICIAR",
        logout: "Cerrar sesion",
        back: "Atras",
        profile_settings: "Perfil y ajustes",
        interests: "Intereses",
        interests_desc: "Elige las categorias que deseas seguir",
        watchlist: "Lista de seguimiento",
        watchlist_desc: "Busca y agrega paises o ciudades (max 10)",
        search_country_city: "Buscar pais o ciudad...",
        add: "Agregar",
        empty_watchlist: "Todavia no hay regiones en la lista",
        default_scope: "Alcance predeterminado",
        default_scope_desc: "Region inicial del mapa",
        save: "Guardar",
        saved: "Guardado",
        save_failed: "Error al guardar",
        language_settings: "Idioma y localizacion",
        language_settings_desc: "Idioma global del sistema y preferencia de noticias",
        guest_notice: "Los invitados tambien pueden usar este selector.",
        waiting_feed: "Esperando datos del feed en vivo.",
        major_updates: "ACTUALIZACIONES CLAVE",
        affected_regions: "REGIONES AFECTADAS",
        no_live_records: "No hay registros en vivo para mostrar.",
        no_regions_yet: "Aun no hay distribucion regional.",
        close: "Cerrar",
        flow: "FLUJO",
        timeline: "Linea de tiempo",
        register_required: "Registrate para desbloquear mas funciones.",
        register_required_short: "Registro requerido",
        guest_language_note: "La seleccion de idioma se guarda tambien en modo invitado.",
        world: "Mundo",
        continent: "Continente",
        country: "Pais",
        city: "Ciudad",
        source_switch: "Cambio de fuente",
        source: "Fuente",
        previous: "Anterior",
        next: "Siguiente",
        no_alt_source: "No se encontro fuente alternativa para esta noticia",
        starred: "Evento destacado",
        star_event: "Destacar evento",
        go_to_source: "Ir a la fuente",
        unreliable: "No fiable",
        suspicious: "Sospechoso",
        reliable: "Fiable",
        official_source: "Oficial",
        reliability: "Fiabilidad",
        location: "Ubicacion",
        alt_sources: "Fuentes alternativas",
        collapse_summary: "Contraer resumen",
        expand_news: "Leer mas",
        time_just_now: "Ahora mismo",
        time_minutes_ago: "min atras",
        time_hours_ago: "horas atras",
        time_days_ago: "dias atras",
        event_time: "Hora del evento",
        score: "Puntuacion",
    },
    fr: {
        ...baseTranslations,
        language: "Langue",
        language_selector: "Selecteur de langue",
        guest_mode: "MODE INVITE",
        search_placeholder: "Rechercher... (ex: seismes en Turquie, derniere minute)",
        search_results_none_title: "RESULTAT DE RECHERCHE",
        search_results_none_body: "n a retourne aucun resultat",
        search_results_none_hint: "Essayez d autres mots ou effacez la recherche",
        search_disabled_message: "Inscrivez-vous pour debloquer recherche, alertes, chronologie et favoris.",
        search_disabled_short: "Recherche desactivee",
        profile: "PROFIL",
        login: "CONNEXION",
        logout: "Deconnexion",
        back: "Retour",
        profile_settings: "Profil et parametres",
        interests: "Interets",
        interests_desc: "Choisissez les categories a suivre",
        watchlist: "Liste de suivi",
        watchlist_desc: "Recherchez et ajoutez des pays ou des villes (max 10)",
        search_country_city: "Rechercher un pays ou une ville...",
        add: "Ajouter",
        empty_watchlist: "Aucune region ajoutee pour le moment",
        default_scope: "Portee par defaut",
        default_scope_desc: "Region affichee a l ouverture",
        save: "Enregistrer",
        saved: "Enregistre",
        save_failed: "Echec de l enregistrement",
        language_settings: "Langue et localisation",
        language_settings_desc: "Langue globale du systeme et preference news",
        guest_notice: "Les invites peuvent aussi changer la langue.",
        waiting_feed: "En attente de donnees live.",
        major_updates: "MISES A JOUR CLES",
        affected_regions: "REGIONS AFFECTEES",
        no_live_records: "Aucun enregistrement live a afficher.",
        no_regions_yet: "La distribution regionale n est pas encore formee.",
        close: "Fermer",
        flow: "FLUX",
        timeline: "Chronologie",
        register_required: "Inscrivez-vous pour debloquer plus de fonctions.",
        register_required_short: "Inscription requise",
        guest_language_note: "La langue est aussi sauvegardee en mode invite.",
        world: "Monde",
        continent: "Continent",
        country: "Pays",
        city: "Ville",
        source_switch: "Changement de source",
        source: "Source",
        previous: "Precedent",
        next: "Suivant",
        no_alt_source: "Aucune source alternative trouvee pour cet article",
        starred: "Evenement marque",
        star_event: "Marquer evenement",
        go_to_source: "Aller a la source",
        unreliable: "Non fiable",
        suspicious: "Suspect",
        reliable: "Fiable",
        official_source: "Officiel",
        reliability: "Fiabilite",
        location: "Localisation",
        alt_sources: "Sources alternatives",
        collapse_summary: "Reduire le resume",
        expand_news: "Lire la suite",
        time_just_now: "A l instant",
        time_minutes_ago: "min",
        time_hours_ago: "heures",
        time_days_ago: "jours",
        event_time: "Heure de l evenement",
        score: "Score",
    },
    de: {
        ...baseTranslations,
        language: "Sprache",
        language_selector: "Sprachauswahl",
        guest_mode: "GASTMODUS",
        search_placeholder: "Suchen... (z. B. Erdbeben in der Turkei, Eilmeldung)",
        search_results_none_title: "SUCHERGEBNIS",
        search_results_none_body: "lieferte keine Ergebnisse",
        search_results_none_hint: "Andere Stichworte versuchen oder Suche leeren",
        search_disabled_message: "Registrieren Sie sich fur Suche, Benachrichtigungen, Zeitachse und Favoriten.",
        search_disabled_short: "Suche deaktiviert",
        profile: "PROFIL",
        login: "LOGIN",
        logout: "Abmelden",
        back: "Zuruck",
        profile_settings: "Profil und Einstellungen",
        interests: "Interessen",
        interests_desc: "Wahlen Sie die Kategorien aus, denen Sie folgen mochten",
        watchlist: "Beobachtungsliste",
        watchlist_desc: "Lander oder Stadte suchen und hinzufugen (max. 10)",
        search_country_city: "Land oder Stadt suchen...",
        add: "Hinzufugen",
        empty_watchlist: "Noch keine Region hinzugefugt",
        default_scope: "Standardbereich",
        default_scope_desc: "Standardregion beim Kartenstart",
        save: "Speichern",
        saved: "Gespeichert",
        save_failed: "Speichern fehlgeschlagen",
        language_settings: "Sprache und Lokalisierung",
        language_settings_desc: "Globale Systemsprache und Nachrichtenpraferenz",
        guest_notice: "Auch Gaste konnen die Sprache andern.",
        waiting_feed: "Warte auf Live-Feed-Daten.",
        major_updates: "WICHTIGE UPDATES",
        affected_regions: "BETROFFENE REGIONEN",
        no_live_records: "Keine Live-Eintrage zum Anzeigen.",
        no_regions_yet: "Noch keine Regionsverteilung vorhanden.",
        close: "Schliessen",
        flow: "FLUSS",
        timeline: "Zeitleiste",
        register_required: "Registrieren Sie sich fur weitere Funktionen.",
        register_required_short: "Registrierung erforderlich",
        guest_language_note: "Die Sprachwahl wird auch im Gastmodus gespeichert.",
        world: "Welt",
        continent: "Kontinent",
        country: "Land",
        city: "Stadt",
        source_switch: "Quellenwechsel",
        source: "Quelle",
        previous: "Vorherige",
        next: "Nachste",
        no_alt_source: "Keine alternative Quelle fur diesen Artikel gefunden",
        starred: "Markiert",
        star_event: "Ereignis markieren",
        go_to_source: "Zur Quelle",
        unreliable: "Unzuverlassig",
        suspicious: "Verdachtig",
        reliable: "Zuverlassig",
        official_source: "Offiziell",
        reliability: "Zuverlassigkeit",
        location: "Standort",
        alt_sources: "Alternative Quellen",
        collapse_summary: "Zusammenfassung einklappen",
        expand_news: "Weiterlesen",
        time_just_now: "Gerade eben",
        time_minutes_ago: "Min. her",
        time_hours_ago: "Std. her",
        time_days_ago: "Tage her",
        event_time: "Ereigniszeit",
        score: "Bewertung",
    },
    ar: {
        ...baseTranslations,
        language: "اللغة",
        language_selector: "محدد اللغة",
        guest_mode: "وضع الضيف",
        search_placeholder: "ابحث... مثال: زلازل تركيا، عاجل",
        search_results_none_title: "نتيجة البحث",
        search_results_none_body: "لم ترجع اي نتائج",
        search_results_none_hint: "جرب كلمات مختلفة او امسح البحث",
        search_disabled_message: "سجل لفتح البحث والتنبيهات والخط الزمني والمفضلة.",
        search_disabled_short: "البحث معطل",
        profile: "الملف",
        login: "دخول",
        logout: "خروج",
        back: "رجوع",
        profile_settings: "الملف والاعدادات",
        interests: "الاهتمامات",
        interests_desc: "اختر الفئات التي تريد متابعتها",
        watchlist: "قائمة المتابعة",
        watchlist_desc: "ابحث واضف دولا او مدنا (الحد 10)",
        search_country_city: "ابحث عن دولة او مدينة...",
        add: "اضافة",
        empty_watchlist: "لم تتم اضافة اي منطقة بعد",
        default_scope: "النطاق الافتراضي",
        default_scope_desc: "المنطقة الافتراضية عند فتح الخريطة",
        save: "حفظ",
        saved: "تم الحفظ",
        save_failed: "فشل الحفظ",
        language_settings: "اللغة والمحلية",
        language_settings_desc: "لغة النظام العامة وتفضيل الاخبار",
        guest_notice: "يمكن للضيف ايضا استخدام اختيار اللغة.",
        waiting_feed: "بانتظار بيانات البث الحي.",
        major_updates: "اهم التحديثات",
        affected_regions: "المناطق المتاثرة",
        no_live_records: "لا توجد سجلات حية للعرض.",
        no_regions_yet: "لم يتشكل توزيع المناطق بعد.",
        close: "اغلاق",
        flow: "تدفق",
        timeline: "الخط الزمني",
        register_required: "سجل لفتح مزيد من الميزات.",
        register_required_short: "التسجيل مطلوب",
        guest_language_note: "يتم حفظ اختيار اللغة حتى في وضع الضيف.",
        world: "العالم",
        continent: "قارة",
        country: "دولة",
        city: "مدينة",
        source_switch: "تبديل المصدر",
        source: "المصدر",
        previous: "السابق",
        next: "التالي",
        no_alt_source: "لم يتم العثور على مصدر بديل لهذا الخبر",
        starred: "مميز",
        star_event: "تمييز الحدث",
        go_to_source: "الذهاب للمصدر",
        unreliable: "غير موثوق",
        suspicious: "مشبوه",
        reliable: "موثوق",
        official_source: "رسمي",
        reliability: "الموثوقية",
        location: "الموقع",
        alt_sources: "مصادر بديلة",
        collapse_summary: "طي الملخص",
        expand_news: "اقرا المزيد",
        time_just_now: "الان",
        time_minutes_ago: "دقيقة",
        time_hours_ago: "ساعة",
        time_days_ago: "يوم",
        event_time: "وقت الحدث",
        score: "النتيجة",
    },
    ru: {
        ...baseTranslations,
        language: "Язык",
        language_selector: "Выбор языка",
        guest_mode: "ГОСТЕВОЙ РЕЖИМ",
        search_placeholder: "Поиск... например: землетрясения в Турции, срочно",
        search_results_none_title: "РЕЗУЛЬТАТ ПОИСКА",
        search_results_none_body: "не дал результатов",
        search_results_none_hint: "Попробуйте другие слова или очистите поиск",
        search_disabled_message: "Зарегистрируйтесь, чтобы открыть поиск, уведомления, таймлайн и избранное.",
        search_disabled_short: "Поиск отключен",
        profile: "ПРОФИЛЬ",
        login: "ВХОД",
        logout: "Выход",
        back: "Назад",
        profile_settings: "Профиль и настройки",
        interests: "Интересы",
        interests_desc: "Выберите категории, за которыми хотите следить",
        watchlist: "Список наблюдения",
        watchlist_desc: "Ищите и добавляйте страны или города (макс. 10)",
        search_country_city: "Поиск страны или города...",
        add: "Добавить",
        empty_watchlist: "Пока нет добавленных регионов",
        default_scope: "Область по умолчанию",
        default_scope_desc: "Стартовый регион карты",
        save: "Сохранить",
        saved: "Сохранено",
        save_failed: "Не удалось сохранить",
        language_settings: "Язык и локализация",
        language_settings_desc: "Глобальный язык системы и предпочтение новостей",
        guest_notice: "Гости тоже могут менять язык.",
        waiting_feed: "Ожидание данных ленты.",
        major_updates: "КЛЮЧЕВЫЕ ОБНОВЛЕНИЯ",
        affected_regions: "ЗАТРОНУТЫЕ РЕГИОНЫ",
        no_live_records: "Нет записей для отображения.",
        no_regions_yet: "Распределение по регионам еще не сформировано.",
        close: "Закрыть",
        flow: "ПОТОК",
        timeline: "Таймлайн",
        register_required: "Зарегистрируйтесь для доступа к большему числу функций.",
        register_required_short: "Требуется регистрация",
        guest_language_note: "Выбор языка сохраняется и в гостевом режиме.",
        world: "Мир",
        continent: "Континент",
        country: "Страна",
        city: "Город",
        source_switch: "Смена источника",
        source: "Источник",
        previous: "Предыдущий",
        next: "Следующий",
        no_alt_source: "Альтернативный источник для этой статьи не найден",
        starred: "Отмечено",
        star_event: "Отметить событие",
        go_to_source: "К источнику",
        unreliable: "Ненадежный",
        suspicious: "Подозрительный",
        reliable: "Надежный",
        official_source: "Официальный",
        reliability: "Надежность",
        location: "Местоположение",
        alt_sources: "Альтернативные источники",
        collapse_summary: "Свернуть",
        expand_news: "Читать далее",
        time_just_now: "Только что",
        time_minutes_ago: "мин. назад",
        time_hours_ago: "ч. назад",
        time_days_ago: "дн. назад",
        event_time: "Время события",
        score: "Оценка",
    },
};

export function translate(language: AppLanguage, key: TranslationKey): string {
    return TRANSLATIONS[language]?.[key] ?? TRANSLATIONS.tr[key] ?? key;
}

export function getLanguageOption(language: AppLanguage): LanguageOption {
    return LANGUAGE_OPTIONS.find((item) => item.code === language) ?? LANGUAGE_OPTIONS[0];
}

export function normalizeLanguage(input: string | null | undefined): AppLanguage {
    return APP_LANGUAGES.find((language) => language === input) ?? "tr";
}

const CATEGORY_LABELS: Record<NewsCategory, Record<AppLanguage, string>> = {
    conflict: { tr: "ÇATIŞMA", en: "CONFLICT", es: "CONFLICTO", fr: "CONFLIT", de: "KONFLIKT", ar: "نزاع", ru: "КОНФЛИКТ" },
    disaster: { tr: "AFET & DEPREM", en: "DISASTER", es: "DESASTRE", fr: "DESASTRE", de: "KATASTROPHE", ar: "كارثة", ru: "КАТАСТРОФА" },
    health: { tr: "SAĞLIK", en: "HEALTH", es: "SALUD", fr: "SANTE", de: "GESUNDHEIT", ar: "صحة", ru: "ЗДОРОВЬЕ" },
    politics: { tr: "SİYASET", en: "POLITICS", es: "POLITICA", fr: "POLITIQUE", de: "POLITIK", ar: "سياسة", ru: "ПОЛИТИКА" },
    economy: { tr: "EKONOMİ", en: "ECONOMY", es: "ECONOMIA", fr: "ECONOMIE", de: "WIRTSCHAFT", ar: "اقتصاد", ru: "ЭКОНОМИКА" },
    technology: { tr: "TEKNOLOJİ", en: "TECHNOLOGY", es: "TECNOLOGIA", fr: "TECHNOLOGIE", de: "TECHNOLOGIE", ar: "تكنولوجيا", ru: "ТЕХНОЛОГИИ" },
    science: { tr: "BİLİM", en: "SCIENCE", es: "CIENCIA", fr: "SCIENCE", de: "WISSENSCHAFT", ar: "علوم", ru: "НАУКА" },
    general: { tr: "GENEL", en: "GENERAL", es: "GENERAL", fr: "GENERAL", de: "ALLGEMEIN", ar: "عام", ru: "ОБЩЕЕ" },
    flight: { tr: "UÇUŞ", en: "FLIGHT", es: "VUELO", fr: "VOL", de: "FLUG", ar: "رحلة", ru: "ПОЛЕТ" },
    marine: { tr: "GEMİ", en: "MARINE", es: "MARITIMO", fr: "MARITIME", de: "MARITIM", ar: "بحري", ru: "МОРСКОЕ" },
};

const ALL_CATEGORIES_LABEL: Record<AppLanguage, string> = {
    tr: "TÜMÜ",
    en: "ALL",
    es: "TODO",
    fr: "TOUT",
    de: "ALLE",
    ar: "الكل",
    ru: "ВСЕ",
};

export function translateCategoryLabel(language: AppLanguage, category: NewsCategory): string {
    return CATEGORY_LABELS[category]?.[language] ?? CATEGORY_LABELS[category]?.tr ?? category.toUpperCase();
}

export function translateAllCategoriesLabel(language: AppLanguage): string {
    return ALL_CATEGORIES_LABEL[language] ?? ALL_CATEGORIES_LABEL.tr;
}
