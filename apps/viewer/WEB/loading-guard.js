// Runs before dependencies so missing scripts/modules still show a clear message.
window.safevisionFailure=function(message){
 window.safevisionFailed=true;
 const entry=document.getElementById('entry'),status=document.getElementById('loadMessage'),button=document.getElementById('startButton');
 entry.hidden=false;status.textContent=message;status.setAttribute('role','alert');button.disabled=true;button.textContent='Carregamento interrompido';
 for(const id of ['hud','bottom','markers','pause','roomsPanel','riskPanel','technicalLabel'])document.getElementById(id).hidden=true;
 window.safevisionStop?.();
};
addEventListener('error',e=>{
 if(e.target?.tagName==='SCRIPT')window.safevisionFailure('Não foi possível carregar um arquivo do tour. Mantenha a pasta completa e o servidor manual aberto; atualize a página quando estiver pronto.');
 else if(e.message){console.error('SAFEVISION:',e.message);window.safevisionFailure('O tour encontrou um erro: '+e.message+' Registre esta mensagem antes de atualizar a página.');}
},true);
addEventListener('unhandledrejection',e=>{console.error('SAFEVISION:',e.reason);window.safevisionFailure('Uma operação do tour falhou. '+(e.reason?.message||'Verifique o console do navegador para detalhes.')+' Registre a mensagem antes de atualizar.');});
