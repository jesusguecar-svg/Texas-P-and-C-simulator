# Simulador Texas Property & Casualty

Simulador educativo en español para el examen **Texas General Lines Property and Casualty (InsTX-PC06)**, powered by **Alleanza Academy**.

## Funcionalidad

- Banco validado de 300 preguntas en ocho dominios (`G1-G6`, `TX1-TX2`).
- Simulación integral o práctica por uno o varios dominios.
- Cantidad de preguntas, temporizador y orden de opciones configurables.
- Explicaciones inmediatas, al finalizar o completamente ocultas.
- Navegador de preguntas, marcado para revisión y cambio de respuestas.
- Herramientas para tachar opciones y resaltar texto del enunciado.
- Historial local con opción de excluir preguntas ya contestadas.
- Reanudación de sesiones después de recargar la página.
- Resultados, rendimiento por dominio y revisión detallada de cada opción.
- Temas claro y oscuro; diseño adaptable para escritorio y móvil.

## Enlaces directos

Una URL con `dominio` inicia la práctica al abrirla, sin la pantalla de configuración. Al arrancar, la app quita la consulta de la barra de direcciones para que recargar reanude esa sesión en lugar de crear otra.

| Parámetro | Ejemplo | Efecto |
| --- | --- | --- |
| `dominio` | `G1` o `G1,G2,TX1` | Dominios separados por coma. Mayúsculas o minúsculas. Si ninguno es válido, se muestra la configuración. |
| `n` | `10` | Cantidad de preguntas. Por defecto 10. Se limita entre 1 y 130. |
| `exp` | `inmediata` | `inmediata` (defecto), `al_final` o `nunca`. |
| `tiempo` | `20` | Minutos. Si es mayor que 0, la sesión tiene temporizador. Si se omite o no es positivo, no hay límite de tiempo. |

Ejemplo: `https://texas-p-and-c-simulator.vercel.app/?dominio=G1&n=10`

> Producto educativo independiente. No está afiliado, patrocinado ni respaldado por Pearson VUE, el Texas Department of Insurance ni ninguna entidad examinadora. Las preguntas son originales y no son reactivos reales del examen.

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Verificación

```bash
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build -- --webpack
npm run questions:validate
```

`test:e2e` arranca el app en el puerto `3100` y usa el Chromium de Playwright. No hace falta Google Chrome instalado en el sistema.

## Vercel

El proyecto usa Next.js y no requiere variables de entorno. Importa el repositorio en Vercel y utiliza la configuración detectada automáticamente:

- Build command: `npm run build`
- Output: administrado por Next.js
- Node.js: `20.9` o superior

## Contenido

- `question-bank/`: banco estructurado. `schema.json` documenta la forma de cada pregunta; `npm run questions:validate` aplica los controles estructurales del banco.
- `sources/`: paquetes de investigación en inglés y español.
- `scripts/validate_question_bank.py`: controles estructurales del banco.
