// The request token belongs to the identity that opened this workspace.
export function projectData(config, auth, owner, signal) {
  const api = window.supabase.createClient(config.url, config.key, {
    accessToken: async () => {
      const { data, error } = await auth.getSession();
      if (signal.aborted || error || data.session?.user.id !== owner ||
          !(data.session.expires_at * 1000 > Date.now())) throw Error('Sessão encerrada. Entre novamente.');
      return data.session.access_token;
    }
  });
  async function read(request) {
    const { data, error } = await request.abortSignal(signal);
    if (error) throw error;
    return data;
  }
  const table = name => api.from(name);
  return {
    async projects() {
      const rows = [];
      for (let offset = 0;; offset += 200) {
        const page = await read(table('projects').select('id,title,description,model_object_key,created_at,updated_at')
          .eq('owner_id', owner).order('updated_at', {ascending:false}).order('id').range(offset,offset+199));
        rows.push(...page);
        if (page.length < 200) return rows;
      }
    },
    profile: () => read(table('profiles').select('display_name').eq('id', owner).maybeSingle()),
    saveProfile: (name, exists) => read((exists ? table('profiles').update({display_name:name}).eq('id',owner)
      : table('profiles').insert({display_name:name})).select('display_name').single()),
    save: (original, values) => read((original ? table('projects').update(values).eq('id',original.id)
      .eq('owner_id',owner).eq('updated_at',original.updated_at) : table('projects').insert(values)).select('id').single()),
    remove: project => read(table('projects').delete().eq('id',project.id).eq('owner_id',owner)
      .eq('updated_at',project.updated_at).select('id').single()),
    history: (id,offset) => read(table('project_versions').select('id,title,description,recorded_at')
      .eq('project_id',id).order('recorded_at',{ascending:false}).order('id').range(offset,offset+19))
  };
}
