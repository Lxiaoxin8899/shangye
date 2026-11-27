// Each callback draws an entire view at its own resolution before the divider blends the two.
export function createSplitView(ctx, owner, initial = 0.5) {
  const targetOptions = { owner, scale: 1, samples: 4, depth: true };
  const left = ctx.gfx.createTarget(targetOptions);
  const right = ctx.gfx.createTarget(targetOptions);
  let cut = initial;
  let dragging = false;
  return {
    reset() {
      cut = initial;
      dragging = false;
    },
    pointer(type, nx) {
      const u = (nx + 1) / 2;
      if (type === 'down') {
        dragging = Math.abs(u - cut) < 0.07;
        return dragging;
      }
      if (!dragging) return false;
      if (type === 'move') cut = Math.max(0.04, Math.min(0.96, u));
      if (type === 'up') dragging = false;
      return true;
    },
    render(target, drawLeft, drawRight) {
      drawLeft(left);
      drawRight(right);
      ctx.transitions.render('split', left, right, target, cut);
    },
    dispose() {
      ctx.gfx.releaseTarget(left);
      ctx.gfx.releaseTarget(right);
    }
  };
}
