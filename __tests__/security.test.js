const { escapeHtml } = require("../script.js");

describe("escapeHtml", () => {
  it("escapes script tags and special characters", () => {
    const input = `<script>alert("xss")</script>&"'<`;
    const result = escapeHtml(input);

    expect(result).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&quot;&#039;&lt;"
    );
    expect(result).not.toContain("<script>");
  });

  it("returns normal text unchanged", () => {
    const input = "Hello Campus Life!";
    const result = escapeHtml(input);

    expect(result).toBe(input);
  });
});


