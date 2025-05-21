$content = Get-Content -Path 'C:\Users\kschu\CascadeProjects\Vettly-2\src\app\settings\page.tsx' -Raw
$pattern = '(<span className="text-gray-700">Dedicated matchmaker</span>\s+</li>)'
$replacement = '$1
                        <li className="flex items-center">
                          <span className="text-purple-600 mr-2">+</span>
                          <span className="text-gray-700">Every match is vetted, including a virtual interview</span>
                        </li>'
$newContent = $content -replace $pattern, $replacement
Set-Content -Path 'C:\Users\kschu\CascadeProjects\Vettly-2\src\app\settings\page.tsx' -Value $newContent
