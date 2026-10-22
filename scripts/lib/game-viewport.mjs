export function fitGameViewport(code) {
  const swap = (from, to) => {
    if (code.split(from).length !== 2) throw new Error('Missing unique viewport target');
    code = code.replace(from, to);
  };
  swap('this.listen(window,"resize",()=>this.resize()),', 'this.listen(window,"resize",()=>this.resize()),this.listen(window,"orientationchange",()=>this.resize()),window.visualViewport&&this.listen(window.visualViewport,"resize",()=>this.resize()),this.viewportObserver=typeof ResizeObserver!=="undefined"?new ResizeObserver(()=>this.resize()):null,this.viewportObserver?.observe(this.el),');
  swap('resize(){let t=this.el.clientWidth,n=this.el.clientHeight;this.renderer.setSize(t,n),this.camera.aspect=t/n,this.camera.updateProjectionMatrix()}', 'resize(){if(this.disposed)return;const t=this.el.clientWidth,n=this.el.clientHeight;if(t<1||n<1)return;this.renderer.setSize(t,n),this.camera.aspect=t/n,this.camera.updateProjectionMatrix()}');
  swap('destroy(){this.disposed=!0,cancelAnimationFrame(this.raf)', 'destroy(){this.disposed=!0,this.viewportObserver?.disconnect(),cancelAnimationFrame(this.raf)');
  return code;
}
