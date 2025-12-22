"use client";

import Link from "next/link";
import "./styles/service5.css";

export default function Service5Page() {
    return (
        <div className="service5-wrapper">
            <header className="blueprint-hero">
                <div className="blueprint-content">
                    <h1>
                        System<br />
                        <span className="stroke-text">Architecture.</span>
                    </h1>
                    <p>
                        ENGINEERING GRADE IT SOLUTIONS.<br />
                        Deploying certified refurbished hardware and enterprise maintenance protocols.
                    </p>
                </div>
            </header>

            <div className="blueprint-grid">

                {/* 1 */}
                <div className="bp-panel">
                    <span className="bp-marker">REF-01</span>
                    <div className="bp-crosshair"></div>
                    <div className="bp-icon-zone">
                        <i className="fas fa-layer-group"></i>
                    </div>
                    <h3>Refurbished Hardware</h3>
                    <p>Premium grade laptops and workstations restored to factory specifications through our 30-point inspection protocol.</p>
                    <div className="bp-specs">
                        <ul className="bp-spec-list">
                            <li className="bp-spec-item">Students / Office</li>
                            <li className="bp-spec-item">Workstations / CAD</li>
                            <li className="bp-spec-item">Gaming Units</li>
                            <li className="bp-spec-item">Export Grade A++</li>
                        </ul>
                    </div>
                    <div className="bp-footer">STATUS: ACTIVE // READY TO SHIP</div>
                </div>

                {/* 2 */}
                <div className="bp-panel">
                    <span className="bp-marker">EXP-02</span>
                    <div className="bp-crosshair"></div>
                    <div className="bp-icon-zone">
                        <i className="fas fa-plane-departure"></i>
                    </div>
                    <h3>Global Logistics</h3>
                    <p>International supply chain management for bulk electronics distribution across Asia, Africa, and Middle East.</p>
                    <div className="bp-specs">
                        <ul className="bp-spec-list">
                            <li className="bp-spec-item">India / Pakistan</li>
                            <li className="bp-spec-item">Vietnam / Asia</li>
                            <li className="bp-spec-item">Africa Region</li>
                            <li className="bp-spec-item">Customs Handling</li>
                        </ul>
                    </div>
                    <div className="bp-footer">STATUS: OPERATIONAL // WORLDWIDE</div>
                </div>

                {/* 3 */}
                <div className="bp-panel">
                    <span className="bp-marker">REP-03</span>
                    <div className="bp-crosshair"></div>
                    <div className="bp-icon-zone">
                        <i className="fas fa-microchip"></i>
                    </div>
                    <h3>Component Repair</h3>
                    <p>Advanced diagnostic and repair facility specializing in motherboard logic and precision replacements.</p>
                    <div className="bp-specs">
                        <ul className="bp-spec-list">
                            <li className="bp-spec-item">Logic Board</li>
                            <li className="bp-spec-item">LCD Assemblies</li>
                            <li className="bp-spec-item">Power ICs</li>
                            <li className="bp-spec-item">Data Recovery</li>
                        </ul>
                    </div>
                    <div className="bp-footer">STATUS: 24-48HR TURNAROUND</div>
                </div>

                {/* 4 */}
                <div className="bp-panel">
                    <span className="bp-marker">TRD-04</span>
                    <div className="bp-crosshair"></div>
                    <div className="bp-icon-zone">
                        <i className="fas fa-sync-alt"></i>
                    </div>
                    <h3>Asset Recovery</h3>
                    <p>Corporate buyback and trade-in programs designed to maximize value recovery from legacy IT infrastructure.</p>
                    <div className="bp-specs">
                        <ul className="bp-spec-list">
                            <li className="bp-spec-item">Bulk Lots</li>
                            <li className="bp-spec-item">Corporate Off-lease</li>
                            <li className="bp-spec-item">Secure Erase</li>
                            <li className="bp-spec-item">Instant Valuation</li>
                        </ul>
                    </div>
                    <div className="bp-footer">STATUS: ACQUISITION ACTIVE</div>
                </div>

                {/* 5 */}
                <div className="bp-panel">
                    <span className="bp-marker">SYS-05</span>
                    <div className="bp-crosshair"></div>
                    <div className="bp-icon-zone">
                        <i className="fas fa-terminal"></i>
                    </div>
                    <h3>System Integrations</h3>
                    <p>Full-stack software deployment including OS licensing, driver optimization, and security suite installation.</p>
                    <div className="bp-specs">
                        <ul className="bp-spec-list">
                            <li className="bp-spec-item">Windows / Linux</li>
                            <li className="bp-spec-item">Driver Config</li>
                            <li className="bp-spec-item">Antivirus</li>
                            <li className="bp-spec-item">Productivity Apps</li>
                        </ul>
                    </div>
                    <div className="bp-footer">STATUS: DEPLOYMENT READY</div>
                </div>

                {/* 6 */}
                <div className="bp-panel">
                    <span className="bp-marker">CORP-06</span>
                    <div className="bp-crosshair"></div>
                    <div className="bp-icon-zone">
                        <i className="fas fa-network-wired"></i>
                    </div>
                    <h3>Enterprise Solutions</h3>
                    <p>Scalable IT infrastructure support for educational institutions and corporate entities with ongoing maintenance.</p>
                    <div className="bp-specs">
                        <ul className="bp-spec-list">
                            <li className="bp-spec-item">AMC Support</li>
                            <li className="bp-spec-item">Large Batches</li>
                            <li className="bp-spec-item">On-site Tech</li>
                            <li className="bp-spec-item">Health Reports</li>
                        </ul>
                    </div>
                    <div className="bp-footer">STATUS: LONG-TERM PARTNER</div>
                </div>

            </div>

            <div className="bp-cta">
                <h2>Initialize Partnership</h2>
                <Link href="/contact" className="bp-btn">
                    Execute Protocol
                </Link>
            </div>
        </div>
    );
}
