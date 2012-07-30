<section class="<%= type %>">
  <header class="comment"><%= comment %></header>
  <code>
    <% for(var s, i = 0; i < signatures.length; ++i) { %>
    <% s = signatures[i]; %>
    <section>
      <% if(type == "function") { %>
      <span class="type"><%= s.type %></span> <span class="name"><%= s.name %></span>(<span class="args"><%= s.args %></span>)
      <% } else if(type == "variable") { %>
      <span class="type"><%= s.type %></span> <span class="name"><%= s.name %></span>
      <% } else if(type == "define") { %>
      <span class="type"><%= s.type %></span> <span class="name"><%= s.name %></span> <span class="value"><%= s.value %></span>
      <% } %>
    </section>
    <% } %>
  </code>
</section>
