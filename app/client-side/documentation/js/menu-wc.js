'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">house-quality documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AccountPageComponent.html" data-type="entity-link" >AccountPageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CreateFurnitureComponent.html" data-type="entity-link" >CreateFurnitureComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CreateFurniturePageComponent.html" data-type="entity-link" >CreateFurniturePageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FinderComponent.html" data-type="entity-link" >FinderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ImageSliderComponent.html" data-type="entity-link" >ImageSliderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoginPageComponent.html" data-type="entity-link" >LoginPageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/MainPageComponent.html" data-type="entity-link" >MainPageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NavigationPanelComponent.html" data-type="entity-link" >NavigationPanelComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotificationComponent.html" data-type="entity-link" >NotificationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PlanHouseComponent.html" data-type="entity-link" >PlanHouseComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PlanHousePageComponent.html" data-type="entity-link" >PlanHousePageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SceneComponent.html" data-type="entity-link" >SceneComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ShopPageComponent.html" data-type="entity-link" >ShopPageComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ViewFurnitureComponent.html" data-type="entity-link" >ViewFurnitureComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#directives-links"' :
                                'data-bs-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/AutoHeightDirective.html" data-type="entity-link" >AutoHeightDirective</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AccountCookieService.html" data-type="entity-link" >AccountCookieService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AccountService.html" data-type="entity-link" >AccountService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CategoryService.html" data-type="entity-link" >CategoryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ClientImageControlService.html" data-type="entity-link" >ClientImageControlService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FinderService.html" data-type="entity-link" >FinderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FurnitureCardControlService.html" data-type="entity-link" >FurnitureCardControlService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FurnitureModelControlService.html" data-type="entity-link" >FurnitureModelControlService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationService.html" data-type="entity-link" >NotificationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProjectService.html" data-type="entity-link" >ProjectService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReportService.html" data-type="entity-link" >ReportService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ServerImageControlService.html" data-type="entity-link" >ServerImageControlService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ShopService.html" data-type="entity-link" >ShopService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interceptors-links"' :
                            'data-bs-target="#xs-interceptors-links"' }>
                            <span class="icon ion-ios-swap"></span>
                            <span>Interceptors</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="interceptors-links"' : 'id="xs-interceptors-links"' }>
                            <li class="link">
                                <a href="interceptors/HttpErrorInterceptor.html" data-type="entity-link" >HttpErrorInterceptor</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/accountFullData.html" data-type="entity-link" >accountFullData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/additionalData.html" data-type="entity-link" >additionalData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/baseFilter.html" data-type="entity-link" >baseFilter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/categoryData.html" data-type="entity-link" >categoryData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/changeAccountDataEmail.html" data-type="entity-link" >changeAccountDataEmail</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/changeSecondaryData.html" data-type="entity-link" >changeSecondaryData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/clientFilters.html" data-type="entity-link" >clientFilters</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/clientProportions.html" data-type="entity-link" >clientProportions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/colorClientData.html" data-type="entity-link" >colorClientData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/colorFromServerData.html" data-type="entity-link" >colorFromServerData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/createEmailAccountData.html" data-type="entity-link" >createEmailAccountData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/editForm.html" data-type="entity-link" >editForm</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/emailAuthData.html" data-type="entity-link" >emailAuthData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/foundFurniture.html" data-type="entity-link" >foundFurniture</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/furnitureAccountData.html" data-type="entity-link" >furnitureAccountData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/furnitureBaseData.html" data-type="entity-link" >furnitureBaseData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/furnitureClientData.html" data-type="entity-link" >furnitureClientData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/furnitureFromServerData.html" data-type="entity-link" >furnitureFromServerData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/furnitureProportions.html" data-type="entity-link" >furnitureProportions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/furnitureShopData.html" data-type="entity-link" >furnitureShopData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/googleAuthData.html" data-type="entity-link" >googleAuthData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/imageSliderClientData.html" data-type="entity-link" >imageSliderClientData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/imageSliderFromServerData.html" data-type="entity-link" >imageSliderFromServerData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/modelInterface.html" data-type="entity-link" >modelInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/objectLoadInterface.html" data-type="entity-link" >objectLoadInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/objectSceneInterface.html" data-type="entity-link" >objectSceneInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/option.html" data-type="entity-link" >option</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/optionRangeQueryData.html" data-type="entity-link" >optionRangeQueryData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/optionSelectQueryData.html" data-type="entity-link" >optionSelectQueryData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/projectInformation.html" data-type="entity-link" >projectInformation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/projectServerInformation.html" data-type="entity-link" >projectServerInformation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/queryData.html" data-type="entity-link" >queryData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/rangeFilter.html" data-type="entity-link" >rangeFilter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/reportResponse.html" data-type="entity-link" >reportResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/roomData.html" data-type="entity-link" >roomData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/roomData-1.html" data-type="entity-link" >roomData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/roomSpanSettings.html" data-type="entity-link" >roomSpanSettings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/selectFilter.html" data-type="entity-link" >selectFilter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/shopData.html" data-type="entity-link" >shopData</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#pipes-links"' :
                                'data-bs-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-add"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/CostFormatPipe.html" data-type="entity-link" >CostFormatPipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});