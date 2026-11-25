const tabs = document.querySelector('#riskTabs');
const review = document.querySelector('#review-case');
function update() {
  const code = tabs.querySelector('[aria-selected="true"]')?.dataset.risk;
  review.hidden = !/^R0[1-5]$/.test(code || '');
  if (!review.hidden) {
    const link = new URL('../../',document.baseURI);
    link.hash = 'inspecoes/'+code;
    review.href = link.href;
  }
}
const observer = new MutationObserver(update);
observer.observe(tabs,{attributes:true,attributeFilter:['aria-selected'],subtree:true,childList:true});
update();
addEventListener('pagehide',() => observer.disconnect(),{once:true});
