# Fase 2 - Auditoría CSS (no destructiva)

- Archivo auditado: `frontend/css/style.css`
- Total bloques CSS analizados: **2318**
- Clases CSS detectadas: **652**
- IDs CSS detectados: **6**

## Uso por vista (tokens encontrados en HTML)
- `login.html`: clases usadas **26**, ids usados **0**
- `registro.html`: clases usadas **21**, ids usados **0**
- `home.html`: clases usadas **81**, ids usados **2**
- `historia.html`: clases usadas **58**, ids usados **1**
- `atacaf.html`: clases usadas **62**, ids usados **1**
- `archivo.html`: clases usadas **41**, ids usados **0**

## Clases potencialmente no usadas en vistas principales
> Nota: estas clases pueden ser usadas por JS dinámico o vistas secundarias; no eliminar sin validación visual.

- `active`
- `activo`
- `admin-action-btn`
- `admin-action-btn--approve`
- `admin-action-btn--reject`
- `admin-actions`
- `admin-status-chip`
- `admin-status-chip--pending`
- `admin-users-counter`
- `admin-users-empty`
- `admin-users-header`
- `admin-users-main`
- `admin-users-panel`
- `admin-users-status`
- `admin-users-status--error`
- `admin-users-status--info`
- `admin-users-status--success`
- `admin-users-table`
- `admin-users-table-wrap`
- `afro-grid__item`
- `agenda-comunitaria-box`
- `agenda-cta`
- `agenda-cupos`
- `agenda-empty`
- `agenda-helper`
- `agenda-interes-msg`
- `agenda-item`
- `agenda-item-date`
- `agenda-item-footer`
- `agenda-item-meta`
- `agenda-item-title`
- `ally-concept`
- `ally-concept__cards`
- `ally-concept__feature`
- `ally-cta-final`
- `ally-gallery`
- `ally-gallery--mosaic`
- `ally-gallery__item--large`
- `ally-header`
- `ally-hero`
- `ally-hero__content`
- `ally-hero__cover`
- `ally-hero__logo`
- `ally-highlight`
- `ally-impact`
- `ally-impact__badge`
- `ally-lightbox`
- `ally-lightbox__backdrop`
- `ally-lightbox__card`
- `ally-lightbox__close`
- `ally-page`
- `ally-page--full`
- `ally-page__actions`
- `ally-page__card`
- `ally-page__grid-two`
- `ally-page__main`
- `ally-profile-about`
- `ally-profile-actions`
- `ally-profile-card`
- `ally-profile-gallery`
- `ally-profile-hero`
- `ally-profile-hero__content`
- `ally-profile-logo`
- `ally-profile-mission-vision`
- `ally-profile-page`
- `ally-profile-section`
- `ally-profile-subtitle`
- `ally-profile-title`
- `ally-quick-nav`
- `ally-summary`
- `archive-intro`
- `archivo-intro`
- `atacaf-recommendations`
- `autor-info`
- `autor-nombre`
- `avatar`
- `avatar-img`
- `avatar-post`
- `back-to-top`
- `btn-cancelar`
- `btn-cancelar-edicion`
- `btn-comentar`
- `btn-crear`
- `btn-eliminar`
- `btn-guardar`
- `btn-guardar-edicion`
- `btn-interesa`
- `btn-like`
- `btn-perfil`
- `btn-perfil-publicar`
- `btn-publicar`
- `btn-registro`
- `btn-remove`
- `btn-secondary`
- `btn-volver`
- `btn-volver-login`
- `btn-whatsapp`
- `carousel-btn`
- `carousel-caption`
- `carousel-container`
- `carousel-slide`
- `cerrar-modal`
- `chip-filtro`
- `close-modal`
- `cms-edit-mode`
- `cms-editable`
- `cms-modal`
- `cms-table`
- `cms-toast-container`
- `comentario`
- `comentarios`
- `comentarios-modal`
- `content-container`
- `crear-post`
- `crear-post-header`
- `crear-sub`
- `crear-titulo`
- `css`
- `cta-afro`
- `dashboard-container`

## Bloques CSS exactos duplicados (mismo selector + mismas propiedades)
> Duplicado exacto no siempre implica borrado seguro si hay intención de orden por contexto; revisar caso a caso.

- `to` aparece **4** veces
- `/* ========================= MODAL LOGIN ========================= */ .modal-login` aparece **2** veces
- `from` aparece **2** veces
- `to` aparece **2** veces
- `to` aparece **2** veces
- `from` aparece **2** veces

## Propuesta modular (sin aplicar aún)
- `global.css`: reset/base, tipografías, body/background, utilidades globales.
- `components.css`: botones, cards, modales, badges, formularios reutilizables.
- `auth.css`: login/registro y variantes pro (`.login-page-pro`, `.btn-login`, `.login-panel`).
- `home.css`: layout home/feed (`main-layout`, `sidebar`, `post`, `home-header`, `home-nav`).
- `feed.css`: publicaciones, grids y detalle de post (`post-image`, galerías, estados).
- `responsive.css`: media queries ordenadas por breakpoint ascendente (480, 768, 1024, 1280...).

## Estrategia segura de migración
1. Crear archivos por módulo y mover reglas por bloques completos sin editar propiedades.
2. Mantener temporalmente `style.css` como agregador con `@import` o concatenación de build.
3. Comparar capturas mobile/tablet/desktop antes de borrar reglas antiguas.
4. Eliminar únicamente duplicados exactos validados por vista.