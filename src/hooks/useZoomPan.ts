import { useEffect, useRef, useState } from 'react';

interface Options {
  viewWidth: number;
  viewHeight: number;
  minScale?: number;
  maxScale?: number;
  zoomFactor?: number;
}

export function useZoomPan({
  viewWidth: W,
  viewHeight: H,
  minScale = 1,
  maxScale = 10,
  zoomFactor = 1.2,
}: Options) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const txRef = useRef(0);
  const tyRef = useRef(0);
  const didDragRef = useRef(false);
  const [transform, setTransform] = useState('');
  const [zoomed, setZoomed] = useState(false);

  // スケールと移動量を境界内にクランプして適用
  function applyTransform(tx: number, ty: number, s: number) {
    const clampedTx = Math.min(0, Math.max(W * (1 - s), tx));
    const clampedTy = Math.min(0, Math.max(H * (1 - s), ty));
    txRef.current = clampedTx;
    tyRef.current = clampedTy;
    scaleRef.current = s;
    setTransform(`translate(${clampedTx} ${clampedTy}) scale(${s})`);
    setZoomed(s > 1.01);
  }

  // ホイールズーム（カーソル位置を中心に拡大縮小）
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * W;
      const cy = ((e.clientY - rect.top) / rect.height) * H;
      const factor = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
      const newScale = Math.min(maxScale, Math.max(minScale, scaleRef.current * factor));
      const ratio = newScale / scaleRef.current;
      applyTransform(
        cx - (cx - txRef.current) * ratio,
        cy - (cy - tyRef.current) * ratio,
        newScale,
      );
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // タッチ操作（シングル＝パン、2本指＝ピンチズーム）
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let lastDist = 0;
    let singleTouch = false;
    let startX = 0, startY = 0, startTx = 0, startTy = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // ブラウザのピンチズームを抑制
        singleTouch = false;
        const t0 = e.touches[0], t1 = e.touches[1];
        lastDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      } else if (e.touches.length === 1) {
        // 1本指は preventDefault しない → タップ時に click が発火する
        singleTouch = true;
        didDragRef.current = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTx = txRef.current;
        startTy = tyRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const midX = (t0.clientX + t1.clientX) / 2;
        const midY = (t0.clientY + t1.clientY) / 2;
        if (lastDist > 0) {
          const factor = dist / lastDist;
          const newScale = Math.min(maxScale, Math.max(minScale, scaleRef.current * factor));
          const rect = el.getBoundingClientRect();
          const cx = ((midX - rect.left) / rect.width) * W;
          const cy = ((midY - rect.top) / rect.height) * H;
          const ratio = newScale / scaleRef.current;
          applyTransform(
            cx - (cx - txRef.current) * ratio,
            cy - (cy - tyRef.current) * ratio,
            newScale,
          );
        }
        lastDist = dist;
      } else if (e.touches.length === 1 && singleTouch) {
        const rect = el.getBoundingClientRect();
        const dx = ((e.touches[0].clientX - startX) / rect.width) * W;
        const dy = ((e.touches[0].clientY - startY) / rect.height) * H;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDragRef.current = true;
        applyTransform(startTx + dx, startTy + dy, scaleRef.current);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      // ドラッグ後は click を抑制、タップ（drag なし）は click を通す
      if (didDragRef.current) e.preventDefault();
      if (e.touches.length < 2) lastDist = 0;
      if (e.touches.length === 0) singleTouch = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ドラッグパン
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let dragging = false;
    let startX = 0, startY = 0, startTx = 0, startTy = 0;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      didDragRef.current = false;
      startX = e.clientX;
      startY = e.clientY;
      startTx = txRef.current;
      startTy = tyRef.current;
      el.style.cursor = 'grabbing';
    };

    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const rect = el.getBoundingClientRect();
      const dx = ((e.clientX - startX) / rect.width) * W;
      const dy = ((e.clientY - startY) / rect.height) * H;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDragRef.current = true;
      applyTransform(startTx + dx, startTy + dy, scaleRef.current);
    };

    const onUp = () => {
      dragging = false;
      el.style.cursor = scaleRef.current > 1.01 ? 'grab' : '';
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleReset() {
    scaleRef.current = 1;
    txRef.current = 0;
    tyRef.current = 0;
    setTransform('');
    setZoomed(false);
    if (wrapperRef.current) wrapperRef.current.style.cursor = '';
  }

  return { wrapperRef, transform, zoomed, didDragRef, handleReset };
}
