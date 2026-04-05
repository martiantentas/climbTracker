// ─── LANGUAGE TYPE ────────────────────────────────────────────────────────────

export type Language = 'en' | 'es' | 'ca'

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────

export const translations = {
  en: {
    // Navigation
    boulders:     'Boulders',
    leaderboard:  'Standings',
    analytics:    'Statistics',
    rules:        'Competition Rules',
    settings:     'Settings',
    profile:      'Profile',
    judging:      'Judging',
    users:        'Users',
    myCompetitions: 'My Events',

    // Filters
    all:          'All',
    completed:    'Topped',
    incomplete:   'Pending',
    gender:       'Gender',
    category:     'Category',

    // Search
    search:           'Find a boulder...',
    searchUsers:      'Find a user...',
    searchCompetitor: 'Search by name or BIB...',

    // Actions
    save:         'Save Changes',
    cancel:       'Cancel',
    confirm:      'Confirm',
    logout:       'Logout',
    download:     'Download',

    // Boulders
    addBoulder:   'Add Boulder',
    editBoulder:  'Edit Boulder',
    deleteBoulder:'Delete',
    color:        'Hold Color',
    difficulty:   'Difficulty',
    points:       'Base Points',
    style:        'Style',
    status:       'Status',
    markCompleted:'Log Top',
    markPending:  'Set to Pending',
    logAttempts:  'Log Tries',
    topLogged:    'Top Registered',
    puntuable:    'Puntuable (Referee Required)',
    number:       'Number',
    sortBy:       'Sort by',

    // Leaderboard
    tops:         'Tops',
    attempts:     'Attempts',
    scorecard:    'Scorecard',
    exportResults:'Export Results',
    selectFormat: 'Select Format',

    // Analytics
    avgTops:      'Average Tops per Athlete',
    fieldDist:    'Participant Distribution',

    // Settings
    name:           'Event Name',
    description:    'Description',
    location:       'Location',
    scoringSystem:  'Scoring System',
    dynamicPot:     'Points Pool (Dynamic)',
    minPoints:      'Minimum Points per Top',
    traditional:    'Traditional',
    dynamic:        'Dynamic (1000)',
    competition:    'Competition',
    managementMode: 'Manage Boulders',
    editRules:      'Edit Rules',
    addCategory:    'New Category',

    // Auth
    login:        'Login',
    register:     'Register',
    email:        'Email Address',
    password:     'Password',
    displayName:  'Display Name',
    noAccount:    "Don't have an account?",
    hasAccount:   'Already have an account?',
    welcomeBack:  'Welcome back!',
    getStarted:   'Join the Competition',

    // Competitions list
    newCompetition:   'New Competition',
    createCompetition: 'Create Competition',
    noCompetitions:   'No competitions yet. Create one to get started!',
    enterCompetition: 'Enter',
    manageEvent:      'Manage',
    deleteConfirm:    'Are you sure you want to delete this competition? All data will be lost.',
    statusDraft:      'Draft',
    statusLive:       'Live',
    statusFinished:   'Finished',
    editDetails:      'Edit Details',

    // Invite / join
    inviteCode:       'Invite Code',
    joinWithCode:     'Join with Code',
    enterInviteCode:  'Enter 6-digit code',
    invalidCode:      'Invalid invite code. Please try again.',
    joinByCodeAction: 'Join Competition',
    copyLink:         'Copy Invite Link',
    linkCopied:       'Link copied!',
    inviteWorkflow:   'Invite Competitors',
    inviteDescription:'Share this code with climbers so they can join instantly.',

    // Leave
    leaveCompetition: 'Leave',
    leaveConfirm:     'Are you sure you want to leave? Your progress will be removed.',

    // Roles
    role:       'User Role',
    competitor: 'Climber',
    organizer:  'Organizer / Judge',

    // Feedback
    successSaved: 'Changes saved successfully!',

    // Misc
    lang:  'Language',
    theme: 'Display Mode',
    demoAdmin: 'Demo Organizer Access',
    demoPass:  'Password: admin123',

    banUser:        'Ban from event',
    deleteUser:     'Delete user',
    makeJudge:      'Make judge',
    makeCompetitor: 'Make competitor',
    makeOrganizer:  'Make organizer',
    banned:         'Banned',
  },

  es: {
    // Navigation
    boulders:     'Bloques',
    leaderboard:  'Clasificación',
    analytics:    'Estadísticas',
    rules:        'Reglas del Evento',
    settings:     'Configuración',
    profile:      'Perfil',
    judging:      'Jueces',
    myCompetitions: 'Mis Eventos',

    // Filters
    all:          'Todos',
    completed:    'Encadenados',
    incomplete:   'Pendientes',
    gender:       'Género',
    category:     'Categoría',

    // Search
    search:           'Buscar bloque...',
    searchCompetitor: 'Buscar por nombre o BIB...',

    // Actions
    save:         'Guardar Cambios',
    cancel:       'Cancelar',
    confirm:      'Confirmar',
    logout:       'Cerrar Sesión',
    download:     'Descargar',

    // Boulders
    addBoulder:   'Añadir Bloque',
    editBoulder:  'Editar Bloque',
    deleteBoulder:'Eliminar',
    color:        'Color de Presas',
    difficulty:   'Dificultad',
    points:       'Puntos Base',
    style:        'Estilo',
    status:       'Estado',
    markCompleted:'Registrar Top',
    markPending:  'Marcar como Pendiente',
    logAttempts:  'Registrar Pegues',
    topLogged:    'Top Registrado',
    puntuable:    'Puntuable (Requiere Juez)',
    number:       'Número',
    sortBy:       'Ordenar por',

    // Leaderboard
    tops:         'Tops',
    attempts:     'Intentos',
    scorecard:    'Ficha de Escalador',
    exportResults:'Exportar Resultados',
    selectFormat: 'Seleccionar Formato',

    // Analytics
    avgTops:      'Media de Tops por Atleta',
    fieldDist:    'Distribución de Atletas',

    // Settings
    name:           'Nombre del Evento',
    description:    'Descripción',
    location:       'Ubicación',
    scoringSystem:  'Sistema de Puntuación',
    dynamicPot:     'Bolsa de Puntos (Dinámico)',
    minPoints:      'Puntos Mínimos por Top',
    traditional:    'Tradicional',
    dynamic:        'Dinámico (1000)',
    competition:    'Competición',
    managementMode: 'Gestionar Bloques',
    editRules:      'Editar Reglas',
    addCategory:    'Nueva Categoría',

    // Auth
    login:        'Iniciar Sesión',
    register:     'Registrarse',
    email:        'Correo Electrónico',
    password:     'Contraseña',
    displayName:  'Nombre Público',
    noAccount:    '¿No tienes cuenta?',
    hasAccount:   '¿Ya tienes cuenta?',
    welcomeBack:  '¡Bienvenido de nuevo!',
    getStarted:   'Únete a la Competición',

    // Competitions list
    newCompetition:   'Nueva Competición',
    createCompetition: 'Crear Competición',
    noCompetitions:   'Sin competiciones. ¡Crea una para empezar!',
    enterCompetition: 'Entrar',
    manageEvent:      'Gestionar',
    deleteConfirm:    '¿Seguro que quieres eliminar esta competición? Se perderán todos los datos.',
    statusDraft:      'Borrador',
    statusLive:       'En Vivo',
    statusFinished:   'Finalizado',
    editDetails:      'Editar Detalles',

    // Invite / join
    inviteCode:       'Código de Invitación',
    joinWithCode:     'Unirse con Código',
    enterInviteCode:  'Introduce el código de 6 dígitos',
    invalidCode:      'Código inválido. Inténtalo de nuevo.',
    joinByCodeAction: 'Unirse a Competición',
    copyLink:         'Copiar Enlace',
    linkCopied:       '¡Enlace copiado!',
    inviteWorkflow:   'Invitar Competidores',
    inviteDescription:'Comparte este código para que los escaladores se unan al instante.',

    // Leave
    leaveCompetition: 'Abandonar',
    leaveConfirm:     '¿Seguro que quieres abandonar? Se eliminará tu progreso.',

    // Roles
    role:       'Rol de Usuario',
    competitor: 'Escalador',
    organizer:  'Organizador / Juez',

    // Feedback
    successSaved: '¡Cambios guardados con éxito!',

    // Misc
    lang:  'Idioma',
    theme: 'Modo Visual',
    demoAdmin: 'Acceso Demo Organizador',
    demoPass:  'Contraseña: admin123',

    users:          'Usuarios',
    searchUsers:    'Buscar usuario...',
    banUser:        'Vetar del evento',
    deleteUser:     'Eliminar usuario',
    makeJudge:      'Hacer juez',
    makeCompetitor: 'Hacer competidor',
    makeOrganizer:  'Hacer organizador',
    banned:         'Vetado',
  },

  ca: {
    // Navigation
    boulders:     'Blocs',
    leaderboard:  'Classificació',
    analytics:    'Estadístiques',
    rules:        'Regles de la Compe',
    settings:     'Configuració',
    profile:      'Perfil',
    judging:      'Jutges',
    myCompetitions: 'Els Meus Esdeveniments',

    // Filters
    all:          'Tots',
    completed:    'Encadenats',
    incomplete:   'Pendents',
    gender:       'Gènere',
    category:     'Categoria',

    // Search
    search:           'Cerca un bloc...',
    searchCompetitor: 'Cerca per nom o BIB...',

    // Actions
    save:         'Desar Canvis',
    cancel:       'Cancel·lar',
    confirm:      'Confirmar',
    logout:       'Sortir',
    download:     'Descarregar',

    // Boulders
    addBoulder:   'Afegir Bloc',
    editBoulder:  'Editar Bloc',
    deleteBoulder:'Eliminar',
    color:        'Color de Preses',
    difficulty:   'Dificultat',
    points:       'Punts Base',
    style:        'Estil',
    status:       'Estat',
    markCompleted:'Registrar Top',
    markPending:  'Marcar com a Pendent',
    logAttempts:  'Registrar Intents',
    topLogged:    'Top Registrat',
    puntuable:    'Puntuable (Requereix Jutge)',
    number:       'Número',
    sortBy:       'Ordenar per',

    // Leaderboard
    tops:         'Tops',
    attempts:     'Intents',
    scorecard:    "Fitxa d'Atleta",
    exportResults:'Exportar Resultats',
    selectFormat: 'Seleccionar Format',

    // Analytics
    avgTops:      'Mitjana de Tops per Atleta',
    fieldDist:    "Distribució d'Atletes",

    // Settings
    name:           "Nom de l'Esdeveniment",
    description:    'Descripció',
    location:       'Ubicació',
    scoringSystem:  'Sistema de Puntuació',
    dynamicPot:     'Borsa de Punts (Dinàmic)',
    minPoints:      'Punts Mínims per Top',
    traditional:    'Tradicional',
    dynamic:        'Dinàmic (1000)',
    competition:    'Competició',
    managementMode: 'Gestionar Blocs',
    editRules:      'Editar Regles',
    addCategory:    'Nova Categoria',

    // Auth
    login:        'Entrar',
    register:     'Registrar-se',
    email:        'Correu Electrònic',
    password:     'Contrasenya',
    displayName:  'Nom Públic',
    noAccount:    'No tens compte?',
    hasAccount:   'Ja tens compte?',
    welcomeBack:  'Bentornat!',
    getStarted:   'Uneix-te a la Compe',

    // Competitions list
    newCompetition:   'Nova Competició',
    createCompetition: 'Crear Competició',
    noCompetitions:   'Sense competicions. Crea una per començar!',
    enterCompetition: 'Entrar',
    manageEvent:      'Gestionar',
    deleteConfirm:    'Segur que vols eliminar aquesta competició? Es perdran totes les dades.',
    statusDraft:      'Esborrany',
    statusLive:       'En Viu',
    statusFinished:   'Finalitzat',
    editDetails:      'Editar Detalls',

    // Invite / join
    inviteCode:       "Codi d'Invitació",
    joinWithCode:     'Uneix-te amb Codi',
    enterInviteCode:  'Introdueix el codi de 6 dígits',
    invalidCode:      'Codi invàlid. Torna-ho a intentar.',
    joinByCodeAction: 'Unir-se a Competició',
    copyLink:         "Copiar Enllaç d'Invitació",
    linkCopied:       'Enllaç copiat!',
    inviteWorkflow:   'Convidar Competidors',
    inviteDescription:"Comparteix aquest codi perquè els escaladors s'uneixin a l'instant.",

    // Leave
    leaveCompetition: 'Abandonar',
    leaveConfirm:     'Segur que vols abandonar? El teu progrés serà eliminat.',

    // Roles
    role:       "Rol d'Usuari",
    competitor: 'Escalador',
    organizer:  'Organitzador / Jutge',

    // Feedback
    successSaved: 'Canvis desats correctament!',

    // Misc
    lang:  'Idioma',
    theme: 'Mode Visual',
    demoAdmin: 'Accés Demo Organitzador',
    demoPass:  'Contrasenya: admin123',

    users:          'Usuaris',
    searchUsers:    'Cerca un usuari...',
    banUser:        "Vetar de l'event",
    deleteUser:     'Eliminar usuari',
    makeJudge:      'Fer jutge',
    makeCompetitor: 'Fer competidor',
    makeOrganizer:  'Fer organitzador',
    banned:         'Vetat',
  },
} as const