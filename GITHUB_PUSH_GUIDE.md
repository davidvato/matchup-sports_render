# Guía para subir MatchUp a GitHub (Terminal)

¡Bienvenido! Sigue estos pasos exactamente para subir tu proyecto a tu cuenta de GitHub.

## 1. Instalación de Git
Si aún no lo has hecho, descarga e instala Git para Windows:
- **Link:** [https://git-scm.com/download/win](https://git-scm.com/download/win)
- **Nota:** Al terminar la instalación, **debes cerrar y volver a abrir esta terminal** para que reconozca el comando `git`.

## 2. Configuración Inicial (Solo la primera vez)
Ejecuta estos dos comandos para que GitHub sepa quién eres:
```bash
git config --global user.name "davidvato"
git config --global user.email "TU_EMAIL_DE_GITHUB@ejemplo.com"
```

## 3. Inicializar el Repositorio Local
Copia y pega estos comandos uno por uno en la carpeta del proyecto:
```bash
# Inicializar Git
git init

# Agregar todos los archivos (incluyendo la base de datos)
git add .

# Crear el primer commit
git commit -m "Primer commit: MatchUp Full Stack con base de datos"
```

## 4. Vincular con GitHub
1. Ve a [github.com/new](https://github.com/new) y crea un repositorio llamado `matchup-sports`. **No** marques la opción de agregar README ni .gitignore (ya los tenemos).
2. Copia la URL de tu repositorio (será algo como `https://github.com/davidvato/matchup-sports.git`).
3. Ejecuta estos comandos reemplazando la URL por la tuya:
```bash
# Cambiar rama a 'main'
git branch -M main

# Conectar con el servidor (Remplaza con tu URL real)
git remote add origin https://github.com/davidvato/matchup-sports.git

# Subir el código
git push -u origin main
```

---
**¿Qué pasa si me pide contraseña?**
Si la terminal te pide autenticación, lo más sencillo es seguir las instrucciones que aparecerán en pantalla para "Sign in with your browser".

**¿Qué pasa con la Base de Datos?**
El archivo `prisma/dev.db` ya está incluido en la configuración, por lo que tus usuarios y torneos actuales se subirán a la nube.
