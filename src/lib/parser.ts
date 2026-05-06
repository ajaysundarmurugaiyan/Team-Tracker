export const extractSkills = (text: string): string[] => {
  const keywords = [
    'react', 'typescript', 'javascript', 'node', 'python', 'next.js', 
    'tailwind', 'css', 'html', 'database', 'sql', 'nosql', 'api', 
    'testing', 'design', 'ui', 'ux', 'git', 'docker', 'cloud'
  ];
  const found = keywords.filter(k => text.toLowerCase().includes(k));
  return found.length ? found : ['General'];
};

export const extractLearnings = (text: string): string[] => {
  const patterns = [/learned (.*?)[\.\,]/gi, /discovered (.*?)[\.\,]/gi, /understood (.*?)[\.\,]/gi];
  const learnings: string[] = [];
  
  patterns.forEach(p => {
    const matches = [...text.matchAll(p)];
    matches.forEach(match => {
      if (match[1]) learnings.push(match[1].trim());
    });
  });
  
  return learnings.length ? learnings : ['No specific learnings captured today.'];
};
