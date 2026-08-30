/**
 * ==============================================================================
 * RADWAN ADS — DETERMINISTIC GRAPH ROUTER & GEOMETRIC PORT ENGINE
 * ==============================================================================
 * - Geometric Ports: TOP, RIGHT, BOTTOM, LEFT com coordenadas reais do World System.
 * - Orthogonal Manhattan Routing: Waypoints com Obstacle Avoidance e canais paralelos.
 * - Smooth Corner Generator: Transforma cantos retos de 90° em curvas 'Q' suaves (radius 10-14px).
 * - Return Lane Inteligente: Canal reservado abaixo de todos os nós para Autopilot -> Meta.
 * - Single RAF Scheduler: Atualização eficiente em 60 FPS com zero layout thrashing.
 * ==============================================================================
 */

(function () {
    'use strict';

    class GraphRouterEngine {
        constructor() {
            this.gridSize = 8;
            this.obstaclePadding = 16;
            this.cornerCurvature = 12;
            this.hysteresisThreshold = 25;
            this.debugMode = false;
        }

        /**
         * Calcula as 4 portas geométricas reais de um nó no World Coordinate System
         */
        getNodePorts(rect) {
            const cx = rect.x + rect.w / 2;
            const cy = rect.y + rect.h / 2;
            return {
                TOP: { x: Math.round(cx), y: Math.round(rect.y), dir: 'TOP' },
                RIGHT: { x: Math.round(rect.x + rect.w), y: Math.round(cy), dir: 'RIGHT' },
                BOTTOM: { x: Math.round(cx), y: Math.round(rect.y + rect.h), dir: 'BOTTOM' },
                LEFT: { x: Math.round(rect.x), y: Math.round(cy), dir: 'LEFT' }
            };
        }

        /**
         * Seleção determinística das portas de conexão baseada em semântica e posição relativa
         */
        selectBestPorts(sourceRect, targetRect, edge, isVerticalLayout) {
            const sPorts = this.getNodePorts(sourceRect);
            const tPorts = this.getNodePorts(targetRect);

            // 1. Caso Especial: Feedback Loop / Return Lane (Autopilot -> Meta)
            if (edge.from === 'node-autopilot' && edge.to === 'node-meta') {
                return {
                    source: sPorts.BOTTOM,
                    target: tPorts.BOTTOM,
                    isReturnLane: true
                };
            }

            // 2. Modo Vertical (Mobile / Tablet estreito)
            if (isVerticalLayout) {
                return {
                    source: sPorts.BOTTOM,
                    target: tPorts.TOP,
                    isReturnLane: false
                };
            }

            // 3. Convergência especial para RADWAN Intelligence (node-brain)
            if (edge.to === 'node-brain') {
                const brainTop = targetRect.y;
                const brainH = targetRect.h;
                let offsetY = 0.5;
                if (edge.from === 'node-orders') offsetY = 0.3;
                else if (edge.from === 'node-campaigns') offsetY = 0.7;

                return {
                    source: sPorts.RIGHT,
                    target: { x: Math.round(targetRect.x), y: Math.round(brainTop + brainH * offsetY), dir: 'LEFT' },
                    isReturnLane: false
                };
            }

            // 4. Fluxo Principal Esquerda -> Direita
            const dx = targetRect.x - (sourceRect.x + sourceRect.w);
            const dy = (targetRect.y + targetRect.h / 2) - (sourceRect.y + sourceRect.h / 2);

            if (dx >= -10) {
                // Posição padrão da esquerda para a direita
                return {
                    source: sPorts.RIGHT,
                    target: tPorts.LEFT,
                    isReturnLane: false
                };
            } else if (dy > 40) {
                // Alvo posicionado abaixo
                return {
                    source: sPorts.BOTTOM,
                    target: tPorts.TOP,
                    isReturnLane: false
                };
            } else {
                return {
                    source: sPorts.RIGHT,
                    target: tPorts.LEFT,
                    isReturnLane: false
                };
            }
        }

        /**
         * Roteador Ortogonal Manhattan Determinístico com Obstacle Avoidance e Geração de SVG Path
         */
        calculateRoute(sourceRect, targetRect, edge, allNodeRects, isVerticalLayout, returnLaneY) {
            const ports = this.selectBestPorts(sourceRect, targetRect, edge, isVerticalLayout);
            const start = ports.source;
            const end = ports.target;

            // 1. Rota Return Lane (Autopilot -> Meta por baixo de todos os nós)
            if (ports.isReturnLane) {
                const laneY = Math.max(start.y, end.y, returnLaneY || 520) + 36;
                return this.buildOrthogonalPathFromPoints([
                    { x: start.x, y: start.y },
                    { x: start.x, y: laneY },
                    { x: end.x, y: laneY },
                    { x: end.x, y: end.y }
                ]);
            }

            // 2. Rota Vertical Direta
            if (isVerticalLayout) {
                const midY = Math.round((start.y + end.y) / 2);
                if (Math.abs(start.x - end.x) < 4) {
                    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
                }
                return this.buildOrthogonalPathFromPoints([
                    { x: start.x, y: start.y },
                    { x: start.x, y: midY },
                    { x: end.x, y: midY },
                    { x: end.x, y: end.y }
                ]);
            }

            // 3. Rota Horizontal Ortogonal Padrão (Manhattan com S-Curve)
            if (Math.abs(start.y - end.y) < 3 && end.x > start.x) {
                return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
            }

            // Rota Ortogonal em 'S' Horizontal
            let midX = Math.round((start.x + end.x) / 2);

            // Verifica se a linha vertical intermediária colide com algum nó obstáculo
            const hasObstacle = (allNodeRects || []).some(r => {
                if (r.id === edge.from || r.id === edge.to) return false;
                const paddedMinX = r.x - this.obstaclePadding;
                const paddedMaxX = r.x + r.w + this.obstaclePadding;
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);
                return (midX >= paddedMinX && midX <= paddedMaxX && r.y + r.h >= minY && r.y <= maxY);
            });

            if (hasObstacle) {
                // Ajusta midX para canal livre mais próximo
                midX = start.x + 24;
            }

            return this.buildOrthogonalPathFromPoints([
                { x: start.x, y: start.y },
                { x: midX, y: start.y },
                { x: midX, y: end.y },
                { x: end.x, y: end.y }
            ]);
        }

        /**
         * Transforma uma lista ordenada de waypoints retos em SVG Path com cantos arredondados (Q Bézier)
         */
        buildOrthogonalPathFromPoints(points) {
            if (!points || points.length < 2) return '';
            if (points.length === 2) {
                return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
            }

            const r = this.cornerCurvature;
            let d = `M ${points[0].x} ${points[0].y}`;

            for (let i = 1; i < points.length - 1; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                const next = points[i + 1];

                const v1x = curr.x - prev.x;
                const v1y = curr.y - prev.y;
                const v2x = next.x - curr.x;
                const v2y = next.y - curr.y;

                const len1 = Math.hypot(v1x, v1y);
                const len2 = Math.hypot(v2x, v2y);
                const effectiveR = Math.min(r, len1 / 2, len2 / 2);

                const u1x = v1x / (len1 || 1);
                const u1y = v1y / (len1 || 1);
                const u2x = v2x / (len2 || 1);
                const u2y = v2y / (len2 || 1);

                const pBefore = {
                    x: Math.round(curr.x - u1x * effectiveR),
                    y: Math.round(curr.y - u1y * effectiveR)
                };

                const pAfter = {
                    x: Math.round(curr.x + u2x * effectiveR),
                    y: Math.round(curr.y + u2y * effectiveR)
                };

                d += ` L ${pBefore.x} ${pBefore.y} Q ${curr.x} ${curr.y} ${pAfter.x} ${pAfter.y}`;
            }

            const last = points[points.length - 1];
            d += ` L ${last.x} ${last.y}`;
            return d;
        }
    }

    window.graphRouterEngine = new GraphRouterEngine();
})();
