/**
 * Dynamic syntax highlighter in VS Code theme.
 * Highlights HTML, CSS, JavaScript, and generic code.
 */
export const highlightCode = (code: string): string => {
  if (!code) return "";
  
  // HTML-decode standard entities first so we process raw code characters
  let decoded = code
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  // Escape standard characters for HTML output safely
  let escaped = decoded
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Regular expression to match comments, strings, tags, keywords, and numbers
  // Group 1: HTML comments (<!-- ... -->)
  // Group 2: Block comments (/* ... */)
  // Group 3: Line comments (// ...)
  // Group 4: Strings ("..." or '...' or `...`)
  // Group 5: HTML tags
  // Group 6: JS Keywords
  // Group 7: Numbers
  const regex = /(&lt;!--[\s\S]*?--&gt;)|(\/\*[\s\S]*?\*\/)|(\/\/[^\r\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(&lt;\/?[a-zA-Z][\w-]*[\s\S]*?\/?&gt;)|\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|export|import|from|new|this|typeof|instanceof|async|await|try|catch|finally|throw|console)\b|\b(\d+(?:\.\d+)?)\b/g;

  return escaped.replace(regex, (match, htmlComment, blockComment, lineComment, str, htmlTag, keyword, num) => {
    if (htmlComment || blockComment || lineComment) {
      return `<span style="color: #6A9955; font-style: italic;">${match}</span>`;
    }
    if (str) {
      return `<span style="color: #CE9178;">${match}</span>`;
    }
    if (htmlTag) {
      // Parse the tag structure inside &lt; ... &gt;
      const isClose = match.startsWith("&lt;/");
      const cleanMatch = match.replace(/^&lt;\/?/, "").replace(/\/?&gt;$/, "");
      const tagNameMatch = cleanMatch.match(/^([a-zA-Z][\w-]*)/);
      
      if (tagNameMatch) {
        const tagName = tagNameMatch[1];
        let rest = cleanMatch.substring(tagName.length);
        
        // Highlight attributes inside the tag
        // Attribute name is light blue (#9CDCFE), value is salmon (#CE9178)
        rest = rest.replace(/([\w-]+)\s*=\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\w+)/g, (_, attrName, attrValue) => {
          return ` <span style="color: #9CDCFE;">${attrName}</span><span style="color: #D4D4D4;">=</span><span style="color: #CE9178;">${attrValue}</span>`;
        });
        
        return `<span style="color: #808080;">&lt;${isClose ? "/" : ""}</span><span style="color: #569CD6;">${tagName}</span>${rest}<span style="color: #808080;">${match.endsWith("/&gt;") ? "/" : ""}&gt;</span>`;
      }
      return `<span style="color: #808080;">${match}</span>`;
    }
    if (keyword) {
      // VS Code JS keywords color
      const keywordColors: Record<string, string> = {
        console: "#4FC1FF",
        function: "#569CD6",
        return: "#C586C0",
        if: "#C586C0",
        else: "#C586C0",
        for: "#C586C0",
        while: "#C586C0",
        const: "#569CD6",
        let: "#569CD6",
        var: "#569CD6",
      };
      const color = keywordColors[keyword] || "#C586C0";
      return `<span style="color: ${color}; font-weight: bold;">${match}</span>`;
    }
    if (num) {
      return `<span style="color: #B5CEA8;">${match}</span>`;
    }
    return match;
  });
};

/**
 * Highlights all <pre><code>...</code></pre> tags in the material HTML
 * and wraps them in a beautiful, premium VS Code-like card container.
 */
export const highlightMateriContent = (html: string): string => {
  if (!html) return "";
  
  return html.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, (_, codeContent) => {
    const highlighted = highlightCode(codeContent);
    return `
      <div class="my-6 rounded-2xl overflow-hidden border border-[#334155] shadow-2xl transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] bg-[#0F172A] font-['Fira_Code','Courier_New',monospace] text-sm leading-relaxed" style="text-align: left;">
        <div class="bg-[#1E293B] px-5 py-3 flex items-center justify-between border-b border-[#334155]">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-[#EF4444] inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-[#F59E0B] inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-[#10B981] inline-block"></span>
          </div>
          <span class="text-[#94A3B8] text-[10px] font-bold tracking-wider uppercase">index.html (VS Code)</span>
        </div>
        <div class="p-6 overflow-x-auto custom-scrollbar">
          <pre class="font-mono text-[13px] leading-relaxed text-[#E2E8F0] whitespace-pre-wrap select-all m-0 bg-transparent p-0 border-0" style="color: #E2E8F0 !important;">${highlighted}</pre>
        </div>
      </div>
    `;
  });
};
