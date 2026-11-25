import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  LogOut,
  Moon,
  Sun,
  LayoutDashboard,
  BookOpen,
  Shield,
  ChevronDown,
  Search,
  Menu,
  X,
  Volume2,
  VolumeX,
  UserCircle,
  BookmarkCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { useSound } from "@/store/sound";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { NotificationsBell } from "@/components/NotificationsBell";

interface CourseSuggestion {
  _id: string;
  title: string;
  category?: string;
  thumbnail?: string;
}

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const muted = useSound((s) => s.muted);
  const toggleMute = useSound((s) => s.toggle);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const mobileSearchBoxRef = useRef<HTMLDivElement>(null);
  const isLoginPage = location.pathname === "/login";
  const hideSearch = isLoginPage || location.pathname === "/forgot-password";

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpen(false);
    setSuggestOpen(false);
  }, [location.pathname]);

  // Debounce the search input so we don't query on every keystroke
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 150);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data: suggestions = [] } = useQuery<CourseSuggestion[]>({
    queryKey: ["course-suggest", debouncedSearch],
    queryFn: async () => {
      const { data } = await api.get("/courses", {
        params: { search: debouncedSearch },
      });
      return (data as CourseSuggestion[]).slice(0, 8);
    },
    enabled: debouncedSearch.length > 0,
    staleTime: 30_000,
  });

  // Reset highlighted suggestion when the list changes
  useEffect(() => {
    setActiveIdx(-1);
  }, [suggestions]);

  const goToCourse = (id: string) => {
    setSuggestOpen(false);
    setSearch("");
    setActiveIdx(-1);
    setMobileOpen(false);
    navigate(`/courses/${id}`);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      goToCourse(suggestions[activeIdx]._id);
      return;
    }
    const q = search.trim();
    setSuggestOpen(false);
    navigate(q ? `/courses?search=${encodeURIComponent(q)}` : "/courses");
    setMobileOpen(false);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setSuggestOpen(false);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    if (!suggestOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideDesktop = searchBoxRef.current?.contains(t);
      const insideMobile = mobileSearchBoxRef.current?.contains(t);
      if (!insideDesktop && !insideMobile) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [suggestOpen]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    setMobileOpen(false);
    logout();
    navigate("/");
  };

  const itemCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
      isActive
        ? "bg-ht-yellow/20 text-ht-black dark:text-ht-yellow"
        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
    );

  const mobileItemCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
      isActive
        ? "bg-ht-yellow text-ht-black"
        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
    );

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        {/* thin yellow accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-ht-yellow via-ht-red to-ht-black" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <Logo size={36} />
            <span className="flex items-baseline gap-0.5 leading-none">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                Ht
              </span>
              <span className="font-extrabold text-xl tracking-tight text-ht-red">
                Learn
              </span>
            </span>
          </Link>

          {/* Desktop search */}
          {!hideSearch && (
            <form onSubmit={onSearchSubmit} className="flex-1 max-w-md mx-auto hidden md:block">
              <div className="relative" ref={searchBoxRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="navbar-search"
                  type="search"
                  placeholder="Rechercher un cours...  (/ pour focus)"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSuggestOpen(true);
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  onKeyDown={onSearchKeyDown}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={suggestOpen && suggestions.length > 0}
                  aria-controls="navbar-search-list"
                  aria-autocomplete="list"
                  className="input pl-10 h-10"
                />
                {suggestOpen && debouncedSearch.length > 0 && suggestions.length > 0 && (
                  <ul
                    id="navbar-search-list"
                    role="listbox"
                    className="absolute left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/40 z-50 animate-fade-in"
                  >
                    {suggestions.map((s, i) => (
                      <li key={s._id} role="option" aria-selected={i === activeIdx}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setActiveIdx(i)}
                          onClick={() => goToCourse(s._id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                            i === activeIdx
                              ? "bg-ht-yellow/20 dark:bg-ht-yellow/15"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {s.thumbnail ? (
                              <img
                                src={s.thumbnail}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <BookOpen className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {s.title}
                            </div>
                            {s.category && (
                              <div className="text-xs text-slate-500 truncate">{s.category}</div>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                    <li className="border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSuggestOpen(false);
                          navigate(`/courses?search=${encodeURIComponent(debouncedSearch)}`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Search className="w-4 h-4" />
                        Voir tous les résultats pour "{debouncedSearch}"
                      </button>
                    </li>
                  </ul>
                )}
                {suggestOpen &&
                  debouncedSearch.length > 0 &&
                  suggestions.length === 0 && (
                    <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/40 z-50 px-4 py-3 text-sm text-slate-500 animate-fade-in">
                      Aucun cours ne correspond à "{debouncedSearch}".
                    </div>
                  )}
              </div>
            </form>
          )}

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              aria-label={muted ? "Activer les sons" : "Couper les sons"}
              title={muted ? "Sons coupés" : "Sons activés"}
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              aria-label="Changer de thème"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user && <NotificationsBell />}

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={open}
                >
                  <div className="w-8 h-8 rounded-full bg-ht-yellow flex items-center justify-center text-ht-black text-sm font-extrabold ring-1 ring-ht-black/10 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name[0].toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-medium hidden lg:inline">{user.name}</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-slate-500 transition-transform",
                      open && "rotate-180"
                    )}
                  />
                </button>

                {open && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/40 p-2 animate-fade-in"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      <div className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-ht-yellow/30 text-ht-black dark:bg-ht-yellow/20 dark:text-ht-yellow">
                        {user.role === "admin"
                          ? "Administrateur"
                          : user.role === "teacher"
                          ? "Enseignant"
                          : "Étudiant"}
                      </div>
                    </div>

                    <NavLink to="/profile" className={itemCls}>
                      <UserCircle className="w-4 h-4" /> Mon profil
                    </NavLink>
                    <NavLink to="/courses" className={itemCls}>
                      <BookOpen className="w-4 h-4" /> Cours
                    </NavLink>
                    <NavLink to="/dashboard" className={itemCls}>
                      <LayoutDashboard className="w-4 h-4" /> Tableau de bord
                    </NavLink>
                    {user.role === "student" && (
                      <NavLink to="/bookmarks" className={itemCls}>
                        <BookmarkCheck className="w-4 h-4" /> Mes favoris
                      </NavLink>
                    )}
                    {user.role === "teacher" && (
                      <NavLink to="/teach" className={itemCls}>
                        <GraduationCap className="w-4 h-4" /> Enseigner
                      </NavLink>
                    )}
                    {user.role === "admin" && (
                      <>
                        <NavLink to="/admin/users" className={itemCls}>
                          <Shield className="w-4 h-4" /> Admin · Utilisateurs
                        </NavLink>
                        <NavLink to="/admin/reports" className={itemCls}>
                          <Shield className="w-4 h-4" /> Admin · Signalements
                        </NavLink>
                        <NavLink to="/admin/audit" className={itemCls}>
                          <Shield className="w-4 h-4" /> Admin · Audit
                        </NavLink>
                      </>
                    )}

                    <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-500/10"
                    >
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !isLoginPage && <Link to="/login" className="btn-primary">Connexion</Link>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-1 shrink-0">
            <button
              onClick={() => navigate("/courses")}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={muted ? "Activer les sons" : "Couper les sons"}
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Changer de thème"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 pt-16 bg-white dark:bg-slate-950 animate-fade-in overflow-y-auto">
          <div className="px-4 py-6 space-y-6">
            {!hideSearch && (
              <form onSubmit={onSearchSubmit}>
                <div className="relative" ref={mobileSearchBoxRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Rechercher un cours..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSuggestOpen(true);
                    }}
                    onFocus={() => setSuggestOpen(true)}
                    onKeyDown={onSearchKeyDown}
                    autoFocus
                    autoComplete="off"
                    className="input pl-10 h-11 text-base"
                  />
                </div>
                {suggestOpen && debouncedSearch.length > 0 && suggestions.length > 0 && (
                  <ul className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    {suggestions.map((s, i) => (
                      <li key={s._id}>
                        <button
                          type="button"
                          onClick={() => goToCourse(s._id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors",
                            i === activeIdx
                              ? "bg-ht-yellow/20"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {s.thumbnail ? (
                              <img
                                src={s.thumbnail}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <BookOpen className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {s.title}
                            </div>
                            {s.category && (
                              <div className="text-xs text-slate-500 truncate">{s.category}</div>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </form>
            )}

            {user ? (
              <>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-900">
                  <div className="w-12 h-12 rounded-full bg-ht-yellow flex items-center justify-center text-ht-black font-extrabold text-lg ring-1 ring-ht-black/10 overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    <div className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-ht-yellow/30 text-ht-black dark:bg-ht-yellow/20 dark:text-ht-yellow">
                      {user.role === "admin"
                        ? "Administrateur"
                        : user.role === "teacher"
                        ? "Enseignant"
                        : "Étudiant"}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <NavLink to="/profile" className={mobileItemCls}>
                    <UserCircle className="w-5 h-5" /> Mon profil
                  </NavLink>
                  <NavLink to="/courses" className={mobileItemCls}>
                    <BookOpen className="w-5 h-5" /> Cours
                  </NavLink>
                  <NavLink to="/dashboard" className={mobileItemCls}>
                    <LayoutDashboard className="w-5 h-5" /> Tableau de bord
                  </NavLink>
                  {user.role === "student" && (
                    <NavLink to="/bookmarks" className={mobileItemCls}>
                      <BookmarkCheck className="w-5 h-5" /> Mes favoris
                    </NavLink>
                  )}
                  {user.role === "teacher" && (
                    <NavLink to="/teach" className={mobileItemCls}>
                      <GraduationCap className="w-5 h-5" /> Enseigner
                    </NavLink>
                  )}
                  {user.role === "admin" && (
                    <>
                      <NavLink to="/admin/users" className={mobileItemCls}>
                        <Shield className="w-5 h-5" /> Admin · Utilisateurs
                      </NavLink>
                      <NavLink to="/admin/reports" className={mobileItemCls}>
                        <Shield className="w-5 h-5" /> Admin · Signalements
                      </NavLink>
                      <NavLink to="/admin/audit" className={mobileItemCls}>
                        <Shield className="w-5 h-5" /> Admin · Audit
                      </NavLink>
                    </>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-semibold text-white bg-accent-600 hover:bg-accent-700"
                >
                  <LogOut className="w-5 h-5" /> Déconnexion
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <NavLink to="/courses" className={mobileItemCls}>
                  <BookOpen className="w-5 h-5" /> Explorer les cours
                </NavLink>
                {!isLoginPage && (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full py-3 text-base"
                  >
                    Connexion
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
