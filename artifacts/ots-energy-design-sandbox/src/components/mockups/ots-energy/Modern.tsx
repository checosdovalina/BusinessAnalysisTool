import { useState } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, BadgeCheck, Bell,
  BookOpen, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, Clock3,
  FileCheck2, LayoutDashboard, Menu, MonitorPlay, Network, RadioTower, Search,
  Settings2, Shield, Target, Users
} from "lucide-react";
import "./_group.css";

const nav = [
  { label: "Centro de control", icon: LayoutDashboard, active: true },
  { label: "Evaluaciones", icon: BookOpen },
  { label: "Temas de evaluación", icon: Target },
  { label: "Simuladores", icon: MonitorPlay },
  { label: "Diseño de simulaciones", icon: Settings2 },
  { label: "Solicitudes OTS", icon: ClipboardList },
  { label: "Competencias y DNC", icon: BadgeCheck },
  { label: "Programa anual", icon: CalendarDays },
  { label: "Operadores", icon: Users },
  { label: "Reportes ejecutivos", icon: FileCheck2 },
];

const recent = [
  { name: "Operador 08", title: "Reposición de servicio · S/E Norte", meta: "Evaluación de campo · hace 18 min", status: "En curso", kind: "active", initials: "O8" },
  { name: "Operador 14", title: "Respuesta ante contingencia N-1", meta: "Simulador · hace 46 min", status: "Completado", kind: "done", initials: "O1" },
  { name: "Operador 03", title: "Protección diferencial de transformador", meta: "Evaluación de campo · ayer", status: "Pendiente", kind: "pending", initials: "O3" },
];

function Metric({ label, value, change, icon: Icon, tone, foot }: { label: string; value: string; change: string; icon: typeof Activity; tone: string; foot: string }) {
  return <article className="modern-metric">
    <div className="metric-top">
      <span className={`metric-icon ${tone}`}><Icon size={18} strokeWidth={1.8} /></span>
      <span className="metric-note"><ArrowUpRight size={13} /> {change}</span>
    </div>
    <div className="metric-value">{value}</div>
    <div className="metric-label">{label}</div>
    <div className="metric-foot">{foot}</div>
  </article>;
}

export function Modern() {
  const [mobileNav, setMobileNav] = useState(false);
  const [range, setRange] = useState("7 días");
  const [notice, setNotice] = useState("");

  return (
    <div className="ots-modern">
      <aside className={`modern-sidebar ${mobileNav ? "is-open" : ""}`}>
        <div className="modern-brand">
          <span className="brand-mark" role="img" aria-label="OTS Energy">
            <svg width="36" height="36" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="46" height="46" rx="13" fill="#15383b"/>
              <path d="M14 13h12a3 3 0 0 1 3 3v4h5a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-5v4a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h12v-3H14a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Z" fill="#f27622"/>
              <path d="M17 17h7m-7 14h7m5-8h5" stroke="#ffc16c" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <div><strong>OTS <i>ENERGY</i></strong><small>GRID OPERATIONS TRAINING</small></div>
        </div>
        <div className="side-caption"><span className="pulse-dot" /> OPERACIÓN Y FORMACIÓN</div>
        <nav className="modern-nav" aria-label="Navegación principal">
          {nav.map(({ label, icon: Icon, active }) => <button key={label} className={`modern-nav-item ${active ? "selected" : ""}`} onClick={() => setNotice(`${label} · vista previa`)}>
            <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{active && <span className="nav-mark" />}
          </button>)}
        </nav>
        <div className="sidebar-foot">
          <div className="audit-note"><Shield size={15} /><span>Registro de evidencia<br /><b>Listo para auditoría</b></span></div>
          <div className="profile-row"><span className="profile-avatar">AO</span><span className="profile-name"><b>Administración</b><small>Coordinación operativa</small></span><ChevronDown size={14} /></div>
        </div>
      </aside>

      <main className="modern-main">
        <header className="modern-header">
          <button className="mobile-trigger" aria-label="Abrir navegación" onClick={() => setMobileNav(!mobileNav)}><Menu size={19} /></button>
          <div className="header-search"><Search size={15} /><span>Búsqueda no disponible</span><kbd>⌘ K</kbd></div>
          <div className="header-right">
            <span className="network-state"><RadioTower size={14} /> ENTORNO OPERATIVO</span>
            <button className="icon-button" aria-label="Notificaciones" onClick={() => setNotice("No hay notificaciones nuevas")}><Bell size={17} /><i /></button>
            <span className="header-divider" />
            <button className="user-menu" onClick={() => setNotice("Perfil de Administración")}><span className="mini-avatar">AO</span><b>Admin</b><ChevronDown size={14} /></button>
          </div>
        </header>
        <div className="modern-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span /> VISTA GENERAL <span className="eyebrow-line" /></div>
              <h1>Centro de control</h1>
              <p>Estado de la preparación operativa y los ciclos de competencia.</p>
            </div>
            <div className="date-chip"><CalendarDays size={15} /><span>Miércoles, 12 de febrero</span><ChevronDown size={13} /></div>
          </section>

          <section className="network-banner">
            <div className="banner-grid" />
            <div className="banner-icon"><Network size={21} /></div>
            <div className="banner-copy"><span>CONTINUIDAD OPERATIVA</span><h2>La preparación mantiene la red en marcha.</h2><p>Capacitación, evaluación y evidencia en una sola línea de trabajo.</p></div>
            <div className="banner-status"><span className="status-beacon" /><div><b>Seguimiento activo</b><small>Programa anual en curso</small></div></div>
            <div className="banner-ornament"><span /><span /><span /><span /><span /></div>
          </section>

          <section className="metric-grid" aria-label="Indicadores de entrenamiento">
            <Metric label="Ciclos de evaluación" value="24" change="3 esta semana" icon={ClipboardList} tone="teal" foot="En todos los formatos" />
            <Metric label="En progreso" value="08" change="2 iniciados hoy" icon={Activity} tone="amber" foot="Requieren seguimiento" />
            <Metric label="Ciclos completados" value="13" change="5 esta semana" icon={CheckCircle2} tone="green" foot="Evidencia registrada" />
            <Metric label="Aprobación" value="84.6%" change="2.1 pts" icon={Target} tone="slate" foot="Sobre ciclos finalizados" />
          </section>

          <section className="dashboard-grid">
            <article className="panel activity-panel">
              <div className="panel-heading">
                <div><span className="section-kicker">RITMO DE ACTIVIDAD</span><h3>Ciclos iniciados</h3><p>Distribución por día de inicio</p></div>
                <select aria-label="Rango de actividad" value={range} onChange={(event) => setRange(event.target.value)}><option>7 días</option><option>30 días</option><option>Este año</option></select>
              </div>
              <div className="chart-summary"><b>Actividad semanal</b><span><i /> Ciclos registrados</span></div>
              <div className="chart-wrap">
                <div className="chart-y"><span>8</span><span>6</span><span>4</span><span>2</span><span>0</span></div>
                <div className="bar-chart">
                  <div className="chart-guides"><i /><i /><i /><i /><i /></div>
                  {[{d:"Lun",v:3},{d:"Mar",v:6},{d:"Mié",v:4},{d:"Jue",v:7},{d:"Vie",v:5},{d:"Sáb",v:2},{d:"Dom",v:1}].map((bar,index) => <div className="bar-column" key={bar.d}>
                    <span className={`bar-value ${index === 3 ? "emphasis" : ""}`} style={{height:`${bar.v * 12.5}%`}}><i>{bar.v}</i></span><small>{bar.d}</small>
                  </div>)}
                </div>
              </div>
              <div className="chart-foot"><span><ArrowUpRight size={14} /> Actividad sostenida esta semana</span><span>Actualizado al momento</span></div>
            </article>

            <article className="panel recent-panel">
              <div className="panel-heading">
                <div><span className="section-kicker">SEGUIMIENTO</span><h3>Evaluaciones recientes</h3><p>Últimos ciclos registrados</p></div>
                <button className="text-action" onClick={() => setNotice("Mostrando la vista previa del listado")}>Ver todas <ArrowUpRight size={14} /></button>
              </div>
              <div className="recent-list">
                {recent.map((entry) => <div className="recent-item" key={entry.name}>
                  <span className={`operator-avatar ${entry.kind}`}>{entry.initials}</span>
                  <div className="recent-detail"><b>{entry.title}</b><span>{entry.name} <i>·</i> {entry.meta}</span></div>
                  <span className={`cycle-status ${entry.kind}`}><i />{entry.status}</span>
                </div>)}
              </div>
              <div className="recent-bottom"><span><Clock3 size={14} /> Próxima revisión</span><b>Mañana · 09:30</b></div>
            </article>
          </section>
          <section className="bottom-strip">
            <div className="strip-icon"><AlertTriangle size={16} /></div><div><b>Atención de seguimiento</b><span>Dos ciclos pendientes de asignación de instructor.</span></div>
            <button onClick={() => setNotice("Seguimiento disponible en Evaluaciones")}>Revisar ciclos <ArrowUpRight size={14} /></button>
          </section>
          <footer className="modern-footer"><span>OTS ENERGY <i>·</i> CONTROL DE COMPETENCIAS</span><span><Shield size={12} /> Trazabilidad de capacitación ISO 9001</span></footer>
        </div>
        {notice && <div className="preview-toast" role="status">{notice}<button aria-label="Cerrar" onClick={() => setNotice("")}>×</button></div>}
      </main>
      <style>{`
        .ots-modern{--ink:#15353a;--muted:#718589;--line:#dce8e5;--paper:#f3f7f5;--white:#fbfdfc;--teal:#167a72;--teal-bright:#74d3bd;--amber:#d79735;min-height:100vh;background:var(--paper);color:var(--ink);font-family:'DM Sans',ui-sans-serif,sans-serif;display:flex;font-size:13px}
        .ots-modern *{box-sizing:border-box}
        .modern-sidebar{width:250px;background:#12353a;color:#d8e9e6;position:fixed;inset:0 auto 0 0;z-index:5;display:flex;flex-direction:column;padding:0 14px;border-right:1px solid rgba(217,239,233,.09)}
        .modern-brand{height:76px;display:flex;align-items:center;gap:11px;padding:0 8px;border-bottom:1px solid rgba(217,239,233,.1)}
        .brand-mark{height:36px;width:36px;display:grid;place-items:center;border-radius:11px;background:rgba(116,211,189,.13);border:1px solid rgba(116,211,189,.2);color:#84ddc6}
        .modern-brand strong{font:700 14px 'Space Grotesk',sans-serif;letter-spacing:.11em;color:#f3fbf8}.modern-brand strong i{font-style:normal;color:#79d7c1}.modern-brand small{display:block;margin-top:4px;font-size:8px;letter-spacing:.16em;color:#8da9a7;font-weight:700}
        .side-caption{font-size:9px;letter-spacing:.13em;font-weight:700;color:#8ca9a6;padding:25px 10px 10px;display:flex;align-items:center;gap:8px}.pulse-dot,.eyebrow>span:first-child{width:6px;height:6px;border-radius:50%;background:#78d9c1;box-shadow:0 0 0 3px rgba(116,211,189,.1)}
        .modern-nav{display:flex;flex-direction:column;gap:3px}.modern-nav-item{height:38px;border:0;border-radius:7px;background:transparent;color:#adc1bf;display:flex;align-items:center;gap:11px;padding:0 11px;text-align:left;font:500 11.5px 'DM Sans',sans-serif;cursor:pointer;transition:background .16s,color .16s;position:relative}.modern-nav-item:hover{background:rgba(255,255,255,.06);color:#f5fbf9}.modern-nav-item.selected{color:#fff;background:rgba(117,215,193,.12);box-shadow:inset 2px 0 #77d7c0}.modern-nav-item.selected svg{color:#80d9c3}.modern-nav-item svg{color:#819b99;flex:none}.nav-mark{margin-left:auto;width:5px;height:5px;border-radius:50%;background:#82ddc5}
        .sidebar-foot{margin-top:auto}.audit-note{display:flex;align-items:center;gap:9px;padding:12px;border-radius:8px;background:rgba(255,255,255,.045);color:#82d9c2;font-size:10px;line-height:1.55;margin-bottom:12px}.audit-note span{color:#a8c0bd}.audit-note b{font-weight:600;color:#e1efeb}.profile-row{height:62px;border-top:1px solid rgba(217,239,233,.1);display:flex;align-items:center;gap:9px}.profile-avatar,.mini-avatar{width:29px;height:29px;display:grid;place-items:center;border-radius:9px;background:#315a5d;color:#d8f0e9;font-size:10px;font-weight:700}.profile-name{flex:1;min-width:0}.profile-name b,.profile-name small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.profile-name b{font-size:10px;color:#e8f2ef}.profile-name small{font-size:9px;color:#8fa9a6;margin-top:3px}.profile-row>svg{color:#8fa9a6}
        .modern-main{margin-left:250px;min-height:100vh;width:calc(100% - 250px)}.modern-header{height:62px;position:sticky;top:0;z-index:4;padding:0 32px;background:rgba(251,253,252,.92);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}.header-search{width:258px;height:34px;border:1px solid var(--line);border-radius:7px;background:#f5f9f7;display:flex;align-items:center;gap:9px;padding:0 10px;color:#8a9a9a;font-size:11px}.header-search kbd{margin-left:auto;font-size:9px;border:1px solid #dce6e2;border-radius:4px;padding:2px 4px;color:#879896}.header-right{display:flex;align-items:center;gap:13px}.network-state{height:27px;border-radius:5px;padding:0 9px;display:flex;align-items:center;gap:7px;background:#edf6f2;border:1px solid #dcebe4;color:#34786a;font-size:9px;letter-spacing:.07em;font-weight:700}.icon-button,.user-menu,.mobile-trigger{border:0;background:transparent;color:#607678;cursor:pointer;display:flex;align-items:center;justify-content:center}.icon-button{height:32px;width:32px;position:relative;border-radius:7px}.icon-button:hover,.user-menu:hover{background:#edf4f1}.icon-button i{position:absolute;width:6px;height:6px;background:#d79d45;border:1px solid #fbfdfc;border-radius:50%;top:6px;right:6px}.header-divider{height:23px;width:1px;background:var(--line)}.user-menu{gap:8px;font-size:11px;padding:4px 7px;border-radius:7px}.user-menu b{font-weight:600;color:#29474a}.mini-avatar{height:25px;width:25px;background:#dceee8;color:#247568}.mobile-trigger{display:none}
        .modern-content{max-width:1440px;margin:0 auto;padding:28px 32px 20px}.welcome-row{display:flex;align-items:end;justify-content:space-between;margin-bottom:20px}.eyebrow{display:flex;align-items:center;gap:8px;font-size:9px;font-weight:700;letter-spacing:.17em;color:#47877c}.eyebrow-line{height:1px;width:26px;background:#c3d6d0;margin-left:2px}.welcome-row h1{font:700 27px 'Space Grotesk',sans-serif;letter-spacing:-.045em;margin:8px 0 4px;color:#17373a}.welcome-row p{margin:0;color:#718589;font-size:12px}.date-chip{height:34px;padding:0 11px;border:1px solid var(--line);border-radius:7px;background:var(--white);display:flex;align-items:center;gap:8px;font-size:10px;color:#617879}.date-chip svg:first-child{color:#438b7e}
        .network-banner{position:relative;overflow:hidden;height:126px;border-radius:10px;background:#164449;color:#eaf5f0;display:flex;align-items:center;padding:0 24px;gap:16px;margin-bottom:16px;box-shadow:0 5px 18px rgba(18,63,65,.08)}.banner-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(153,226,203,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(153,226,203,.08) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(90deg,transparent 25%,#000 100%);opacity:.8}.banner-icon,.banner-copy,.banner-status{position:relative;z-index:1}.banner-icon{width:44px;height:44px;border:1px solid rgba(136,218,197,.26);background:rgba(123,211,190,.12);border-radius:12px;display:grid;place-items:center;color:#92e1c8}.banner-copy{flex:1}.banner-copy>span{font-size:8px;font-weight:700;letter-spacing:.17em;color:#91d8c2}.banner-copy h2{margin:5px 0;font:600 18px 'Space Grotesk',sans-serif;letter-spacing:-.025em;color:#f3faf7}.banner-copy p{margin:0;color:#b1c9c3;font-size:10.5px}.banner-status{display:flex;align-items:center;gap:9px;border-left:1px solid rgba(213,243,229,.19);padding-left:22px;margin-right:60px}.status-beacon{width:8px;height:8px;border-radius:50%;background:#83d9a9;box-shadow:0 0 0 4px rgba(131,217,169,.12)}.banner-status b,.banner-status small{display:block}.banner-status b{font-size:10px}.banner-status small{margin-top:4px;font-size:9px;color:#abc6bf}.banner-ornament{position:absolute;right:28px;top:0;height:100%;display:flex;align-items:center;gap:7px;opacity:.4;transform:skew(-24deg)}.banner-ornament span{height:40px;width:3px;background:#83d9c2;border-radius:4px}.banner-ornament span:nth-child(2){height:63px}.banner-ornament span:nth-child(3){height:77px}.banner-ornament span:nth-child(4){height:56px}.banner-ornament span:nth-child(5){height:31px}
        .metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.modern-metric{min-height:132px;background:var(--white);border:1px solid var(--line);border-radius:9px;padding:14px 16px;transition:transform .16s,box-shadow .16s,border-color .16s}.modern-metric:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(32,79,71,.06);border-color:#bfd8ce}.metric-top{display:flex;justify-content:space-between;align-items:center}.metric-icon{height:32px;width:32px;border-radius:9px;display:grid;place-items:center}.metric-icon.teal{background:#e7f4ef;color:#348b79}.metric-icon.amber{background:#fbf1df;color:#b97e29}.metric-icon.green{background:#e9f3e9;color:#5d8d61}.metric-icon.slate{background:#eaf0f1;color:#54757a}.metric-note{display:flex;align-items:center;gap:2px;color:#428b71;font-size:9px;font-weight:600}.metric-value{font:700 25px 'Space Grotesk',sans-serif;letter-spacing:-.04em;margin-top:9px;color:#193c3f}.metric-label{font-size:10px;font-weight:600;color:#496467;margin-top:1px}.metric-foot{font-size:9px;color:#8b9a9a;margin-top:3px}
        .dashboard-grid{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr);gap:14px}.panel{background:var(--white);border:1px solid var(--line);border-radius:9px;min-width:0}.activity-panel{padding:17px 18px 12px}.recent-panel{padding:17px 17px 0}.panel-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.section-kicker{font-size:8px;letter-spacing:.15em;font-weight:700;color:#67948a}.panel-heading h3{margin:5px 0 3px;font:600 15px 'Space Grotesk',sans-serif;letter-spacing:-.02em;color:#1a3d40}.panel-heading p{margin:0;font-size:10px;color:#819192}.panel-heading select{height:29px;border-radius:6px;padding:0 8px;background:#f5f9f7;border:1px solid var(--line);color:#526c6e;font:500 9px 'DM Sans',sans-serif}.chart-summary{margin:17px 0 0;display:flex;justify-content:space-between;align-items:center}.chart-summary b{font-size:10px;color:#516b6c}.chart-summary span{font-size:9px;color:#829393;display:flex;align-items:center;gap:6px}.chart-summary i{width:7px;height:7px;border-radius:2px;background:#267e73}.chart-wrap{height:154px;display:flex;gap:12px;margin-top:8px}.chart-y{height:127px;display:flex;flex-direction:column;justify-content:space-between;font-size:8px;color:#9aa9a8;padding:0 0 0 2px}.bar-chart{position:relative;flex:1;height:100%;display:flex;align-items:stretch;justify-content:space-around;padding:0 5px}.chart-guides{position:absolute;inset:0 0 26px;display:flex;flex-direction:column;justify-content:space-between}.chart-guides i{height:1px;width:100%;background:#eaf0ed}.bar-column{position:relative;z-index:1;width:9%;display:flex;align-items:center;justify-content:flex-end;flex-direction:column;height:100%;gap:8px}.bar-column>span{position:relative;width:min(24px,62%);min-height:6px;border-radius:4px 4px 1px 1px;background:linear-gradient(180deg,#54b29b,#287e72);transition:height .2s}.bar-column>span:not(.emphasis){opacity:.72}.bar-column>span.emphasis{background:linear-gradient(180deg,#e9b860,#cf9237)}.bar-value i{position:absolute;top:-17px;left:50%;transform:translateX(-50%);font-style:normal;font-size:8px;color:#738989}.bar-column small{height:17px;font-size:8px;color:#899a9a}.chart-foot{border-top:1px solid #edf2ef;padding-top:10px;display:flex;justify-content:space-between;color:#809190;font-size:8px}.chart-foot span:first-child{display:flex;align-items:center;gap:4px;color:#478574}
        .text-action{border:0;background:transparent;color:#397e72;display:flex;align-items:center;gap:4px;font:600 9px 'DM Sans',sans-serif;cursor:pointer;padding:4px}.text-action:hover{color:#1e5f57}.recent-list{margin-top:13px}.recent-item{min-height:61px;display:flex;align-items:center;gap:9px;border-top:1px solid #edf2ef}.operator-avatar{width:29px;height:29px;flex:none;display:grid;place-items:center;border-radius:9px;font-size:9px;font-weight:700;color:#447d72;background:#e6f2ed}.operator-avatar.done{color:#738452;background:#edf1e1}.operator-avatar.pending{color:#a67e43;background:#f8efe0}.recent-detail{min-width:0;flex:1}.recent-detail b{display:block;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font-size:9.5px;color:#355558;font-weight:600}.recent-detail>span{display:block;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;margin-top:4px;font-size:8px;color:#8a999a}.recent-detail i{font-style:normal;color:#bdc8c5;padding:0 2px}.cycle-status{border-radius:99px;padding:4px 7px;display:flex;align-items:center;gap:5px;font-size:8px;white-space:nowrap;font-weight:600}.cycle-status i{width:5px;height:5px;border-radius:50%;background:currentColor}.cycle-status.active{color:#a8792a;background:#faf1df}.cycle-status.done{color:#528067;background:#e9f3ec}.cycle-status.pending{color:#788a8b;background:#eff3f1}.recent-bottom{height:37px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #edf2ef;font-size:8px;color:#829393}.recent-bottom span{display:flex;align-items:center;gap:5px}.recent-bottom b{font-weight:600;color:#597173}
        .bottom-strip{margin-top:13px;min-height:52px;padding:8px 13px;display:flex;align-items:center;gap:10px;border:1px solid #ecdfc6;border-radius:8px;background:#fbf7ee}.strip-icon{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#f5ead3;color:#b78332}.bottom-strip>div:nth-child(2){flex:1}.bottom-strip b,.bottom-strip span{display:block}.bottom-strip b{font-size:9px;color:#665437}.bottom-strip span{font-size:8.5px;color:#928263;margin-top:3px}.bottom-strip button{border:0;background:transparent;display:flex;align-items:center;gap:5px;color:#8d6829;font:600 9px 'DM Sans',sans-serif;cursor:pointer}.bottom-strip button:hover{text-decoration:underline}.modern-footer{margin-top:15px;padding-top:11px;border-top:1px solid #e3ece8;display:flex;justify-content:space-between;color:#91a09f;font-size:8px;letter-spacing:.08em}.modern-footer i{font-style:normal;color:#bdc9c5}.modern-footer span:last-child{display:flex;align-items:center;gap:5px;letter-spacing:0}
        .preview-toast{position:fixed;z-index:8;right:22px;bottom:20px;background:#183f42;color:#f2faf6;border:1px solid rgba(255,255,255,.14);border-radius:8px;box-shadow:0 10px 28px #183f4230;padding:11px 14px;font-size:11px;display:flex;align-items:center;gap:14px}.preview-toast button{border:0;background:transparent;color:#a7c4bd;font-size:17px;cursor:pointer}.ots-modern button:focus-visible,.ots-modern select:focus-visible{outline:2px solid #ca973e;outline-offset:2px}
        @media(max-width:1100px){.modern-content{padding:24px 22px 18px}.modern-header{padding:0 22px}.modern-sidebar{width:224px}.modern-main{margin-left:224px;width:calc(100% - 224px)}.banner-status{margin-right:38px}.metric-grid{gap:9px}.modern-metric{padding:13px}.recent-panel{padding-inline:13px}.recent-item{gap:7px}.cycle-status{padding:4px 5px}}
        @media(max-width:850px){.modern-sidebar{transform:translateX(-100%);transition:transform .2s ease;box-shadow:12px 0 32px rgba(12,42,45,.15)}.modern-sidebar.is-open{transform:translateX(0)}.modern-main{margin-left:0;width:100%}.mobile-trigger{display:flex}.modern-header{justify-content:flex-start;gap:12px}.header-search{width:min(258px,38vw)}.header-right{margin-left:auto}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-grid{grid-template-columns:1fr}.recent-panel{padding-inline:17px}.recent-item{gap:10px}.cycle-status{padding:4px 8px}}
        @media(max-width:560px){.modern-header{height:56px;padding:0 13px;gap:8px}.header-search{width:auto;flex:1;height:32px}.header-search kbd,.network-state,.header-divider,.user-menu b,.user-menu>svg{display:none}.header-right{gap:5px}.user-menu{padding:3px}.modern-content{padding:20px 13px 16px}.welcome-row{align-items:flex-start;gap:12px;flex-direction:column;margin-bottom:16px}.welcome-row h1{font-size:24px}.date-chip{align-self:flex-start;height:30px}.network-banner{height:auto;min-height:132px;padding:18px 14px;gap:11px;align-items:flex-start}.banner-icon{width:35px;height:35px;flex:none}.banner-copy h2{font-size:15px;max-width:260px}.banner-copy p{max-width:230px;line-height:1.5}.banner-status{display:none}.banner-ornament{right:10px;opacity:.23}.metric-grid{gap:8px}.modern-metric{min-height:122px;padding:12px}.metric-note{font-size:8px}.metric-value{font-size:22px}.metric-label{font-size:9px}.panel-heading h3{font-size:14px}.activity-panel{padding:15px 12px 11px}.chart-wrap{height:142px}.recent-panel{padding:15px 12px 0}.recent-item{min-height:64px;gap:7px}.recent-detail b{font-size:9px}.recent-detail>span{font-size:7px}.cycle-status{font-size:7px;padding:4px 5px}.bottom-strip{align-items:flex-start}.bottom-strip button{font-size:8px;white-space:nowrap;margin-top:8px}.modern-footer{font-size:7px;gap:8px}.modern-footer span:last-child{font-size:7px}}
      `}</style>
    </div>
  );
}
