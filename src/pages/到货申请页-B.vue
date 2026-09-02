<template>
  <div class="detail-page">
    <!-- 固定顶栏 -->
    <div class="detail-header">
      <div class="detail-header-left">
        <a-button type="text" class="back-btn" @click="emit('back')">
          <template #icon><LeftOutlined /></template>
        </a-button>
        <a-tooltip :title="`编辑到货-${detail.projectName}`">
          <span class="detail-title">{{ `编辑到货-${detail.projectName}` }}</span>
        </a-tooltip>
        <a-tag color="blue">到货</a-tag>
        <a-tag :color="STATUS_COLOR[detail.filingStatus]">
          {{ STATUS_LABEL[detail.filingStatus] }}
        </a-tag>
        <a-tag
          v-if="SUB_STATUS_LABEL[detail.filingStatus]"
          :color="SUB_STATUS_COLOR[detail.filingStatus]"
        >{{ SUB_STATUS_LABEL[detail.filingStatus] }}</a-tag>
        <span class="detail-header-meta">
          <span class="detail-header-meta-item">{{ detail.stationType }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ props.policyType === 'nonstandard' ? PROJECT_TYPE_LABEL[detail.projectType] : '公建 EMC' }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ props.initData?.policyType === 'nonstandard' ? '非标政策' : '标准政策' }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ detail.stationNo }}<CopyOutlined class="copy-icon" @click="copyStationNo(detail.stationNo)" /></span>
        </span>
      </div>

    </div>

    <div ref="detailBodyRef" class="detail-body" :style="scrollPad > 0 ? { paddingBottom: scrollPad + 'px' } : {}">
      <!-- 左侧：只读 TAB 内容 -->
      <div class="detail-main">


        <!-- ── 项目信息 ── -->
        <div class="detail-card detail-card--plain">
          <div class="section-title section-title--toggle" :class="{ 'section-title--collapsed': !projectInfoOpen }" @click="projectInfoOpen = !projectInfoOpen">项目信息<DownOutlined class="section-toggle-icon" :class="{ rotated: !projectInfoOpen }" /></div>
          <div v-show="projectInfoOpen">

          <!-- 标准政策布局 -->
          <template v-if="props.policyType !== 'nonstandard'">
            <div class="info-section" style="margin-top:0">
              <div class="info-section-title">基本信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">电站类型</span><span class="info-value">{{ detail.stationType }}</span></div>
                <div class="info-item"><span class="info-label">项目名称</span><span class="info-value">{{ detail.projectName }}</span></div>
                <div class="info-item"><span class="info-label">项目类型</span><span class="info-value">{{ '公建 EMC' }}</span></div>
                <div class="info-item"><span class="info-label">匹配政策</span><span class="info-value">标准政策</span></div>
                <div class="info-item"><span class="info-label">所属区域公司</span><span class="info-value">{{ detail.regionCompany }}</span></div>
                <div class="info-item"><span class="info-label">项目地址</span><span class="info-value">{{ detail.region.join(' / ') }}</span></div>
                <div class="info-item"><span class="info-label">详细地址</span><span class="info-value">{{ detail.addressDetail }}</span></div>
                <div class="info-item"><span class="info-label">项目容量</span><span class="info-value">{{ detail.capacity }} kW</span></div>
                <div class="info-item"><span class="info-label">并网电压等级</span><span class="info-value">{{ GRID_VOLTAGE_LABEL[detail.gridVoltage] }}</span></div>
                <div class="info-item"><span class="info-label">代理商名称</span><span class="info-value">{{ detail.agentName }}</span></div>
                <div class="info-item"><span class="info-label">用电企业名称</span><span class="info-value">{{ detail.userEntName }}</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">供应商信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">开发商名称</span><span class="info-value">{{ detail.developerName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">施工商名称</span><span class="info-value">{{ detail.constructorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">监理商名称</span><span class="info-value">{{ detail.supervisorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">设计商名称</span><span class="info-value">{{ detail.designerName || '—' }}</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">合同信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">EMC 电价</span><span class="info-value">{{ detail.emcPrice }} 元/kWh</span></div>
                <div class="info-item"><span class="info-label">EMC 年限</span><span class="info-value">{{ detail.emcYears }} 年</span></div>
                <div class="info-item"><span class="info-label">消纳比例</span><span class="info-value">{{ detail.consumptionRate }}%</span></div>
                <div v-if="detail.projectType === 'public_emc'" class="info-item"><span class="info-label">公建机构类型</span><span class="info-value">{{ PUBLIC_BUILD_TYPE_LABEL[detail.publicBuildType] || '—' }}</span></div>
              </div>
            </div>
            <div class="info-section" style="border-top: none; padding-top: 0">
              <div class="info-grid">
                <div class="info-item info-item--span2"><span class="info-label">产权证明</span><span class="info-value"><FileAttachmentView v-if="detail.propertyProof?.length" :files="detail.propertyProof" /><span v-else>—</span></span></div>
                <div class="info-item info-item--span2"><span class="info-label">营业执照/组织机构代码证</span><span class="info-value"><FileAttachmentView v-if="detail.bizLicense?.length" :files="detail.bizLicense" /><span v-else>—</span></span></div>
                <div class="info-item info-item--span2"><span class="info-label">开户许可证</span><span class="info-value"><FileAttachmentView v-if="detail.bankAccountCert" :files="[detail.bankAccountCert]" /><span v-else>—</span></span></div>
                <div class="info-item" style="grid-column-start:1"><span class="info-label">法定代表人身份证正面</span><div class="id-card-img id-card-img--front" v-if="detail.idCardFront" /><span v-else>—</span></div>
                <div class="info-item"><span class="info-label">法定代表人身份证反面</span><div class="id-card-img id-card-img--back" v-if="detail.idCardBack" /><span v-else>—</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">项目产权信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">项目公司</span><span class="info-value">{{ detail.projectCompany || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EPC 公司</span><span class="info-value">{{ detail.epcCompany || '—' }}</span></div>
                <div class="info-item"><span class="info-label">产权公司</span><span class="info-value">{{ detail.ownershipCompany || '—' }}</span></div>
              </div>
            </div>
          </template>

          <!-- 非标政策布局（平铺，无子标题） -->
          <template v-else>
            <div class="info-section" style="margin-top:0">
              <div class="info-grid">
                <div class="info-item"><span class="info-label">OA编号</span><span class="info-value">{{ detail.oaNo || '—' }}</span></div>
                <div class="info-item"><span class="info-label">项目名称</span><span class="info-value">{{ detail.projectName }}</span></div>
                <div class="info-item"><span class="info-label">项目类型</span><span class="info-value">{{ PROJECT_TYPE_LABEL[detail.projectType] }}</span></div>
                <div class="info-item"><span class="info-label">是否政策匹配</span><span class="info-value">否</span></div>
                <div class="info-item"><span class="info-label">省市区</span><span class="info-value">{{ detail.region?.join(' / ') || '—' }}</span></div>
                <div class="info-item info-item--span2"><span class="info-label">详细地址</span><span class="info-value">{{ detail.addressDetail || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EMC 年限</span><span class="info-value">{{ detail.emcYears }} 年</span></div>
                <div class="info-item"><span class="info-label">项目容量</span><span class="info-value">{{ detail.capacity }} kW</span></div>
                <div class="info-item"><span class="info-label">并网电压等级</span><span class="info-value">{{ GRID_VOLTAGE_LABEL[detail.gridVoltage] }}</span></div>
                <div class="info-item"><span class="info-label">代理商名称</span><span class="info-value">{{ detail.agentName }}</span></div>
                <div class="info-item"><span class="info-label">用电企业名称</span><span class="info-value">{{ detail.userEntName }}</span></div>
                <div class="info-item"><span class="info-label">开发商名称</span><span class="info-value">{{ detail.developerName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">施工商名称</span><span class="info-value">{{ detail.constructorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EMC 电价</span><span class="info-value">{{ detail.emcPrice }} 元/kWh</span></div>
                <div class="info-item"><span class="info-label">消纳比例</span><span class="info-value">{{ detail.consumptionRate }}%</span></div>
                <div class="info-item"><span class="info-label">公建机构类型</span><span class="info-value">{{ PUBLIC_BUILD_TYPE_LABEL[detail.publicBuildType] || '—' }}</span></div>
                <div class="info-item info-item--span2" style="grid-column-start:1"><span class="info-label">产权证明</span><span class="info-value"><FileAttachmentView v-if="detail.propertyProof?.length" :files="detail.propertyProof" /><span v-else>—</span></span></div>
              </div>
            </div>
          </template>
          </div>
        </div>


        <div ref="tabsWrapperRef" class="tabs-wrapper" :class="{ 'tabs-stuck': tabsStuck }">
          <a-tabs
            v-model:active-key="activeTab"
            class="detail-tabs"
            :tab-bar-style="{ padding: tabsStuck ? '0 24px' : '8px 24px 0', marginBottom: 0 }"
            @tab-click="scrollToTabNav"
          >
            <!-- ──────── 勘察 TAB ──────── -->
            <a-tab-pane key="survey" tab="勘察">
              <div class="tab-body">

                <!-- 项目总体概况 -->
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">项目总体概况</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">建筑数量</span>
                      <span class="info-value">{{ detail.buildingCount != null ? detail.buildingCount + ' 个' : '—' }}</span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">屋面类型</span>
                      <span class="info-value">
                        <template v-if="detail.roofLightSteel || detail.roofConcrete || detail.roofOther">
                          <span v-if="detail.roofLightSteel">轻钢结构屋面 {{ detail.roofLightSteel }} 个</span>
                          <span v-if="detail.roofLightSteel && detail.roofConcrete">　</span>
                          <span v-if="detail.roofConcrete">混凝土屋面 {{ detail.roofConcrete }} 个</span>
                          <span v-if="(detail.roofLightSteel || detail.roofConcrete) && detail.roofOther">　</span>
                          <span v-if="detail.roofOther">其他 {{ detail.roofOther }} 个</span>
                        </template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">总平面布置图</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.siteLayoutFiles?.length" :files="detail.siteLayoutFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 每个建筑的屋面情况 -->
                <div class="info-section">
                  <div class="info-section-title">每个建筑的屋面情况</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">彩钢瓦瓦型</span>
                      <span class="info-value">{{ STEEL_ROOF_LABEL[detail.steelRoofType] || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">瓦面锈蚀情况</span>
                      <span class="info-value">{{ RUST_LABEL[detail.rustCondition] || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">屋面是否有障碍物</span>
                      <span class="info-value">
                        <template v-if="detail.hasObstacle === 'yes'">有，高 {{ detail.obstacleHeight }}m / 宽 {{ detail.obstacleWidth }}m</template>
                        <template v-else-if="detail.hasObstacle === 'no'">无</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">屋面是否有采光带</span>
                      <span class="info-value">
                        <template v-if="detail.hasSkylight === 'yes'">有，采光带宽度 {{ detail.skylightWidth }}mm</template>
                        <template v-else-if="detail.hasSkylight === 'no'">无</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 用户配电情况 -->
                <div class="info-section">
                  <div class="info-section-title">用户配电情况</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">进线电压等级</span>
                      <span class="info-value">{{ detail.inletVoltage != null ? detail.inletVoltage + ' kV' : '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">用户进线接入方式</span>
                      <span class="info-value">{{ INLET_CONN_LABEL[detail.inletConnectionType] || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">进线回路数</span>
                      <span class="info-value">{{ detail.circuitCount != null ? detail.circuitCount + ' 回' : '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">进线电缆规格</span>
                      <span class="info-value">{{ detail.cableSpec != null ? detail.cableSpec + ' mm²' : '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">用户变压器</span>
                      <span class="info-value">{{ detail.transformerCount != null ? detail.transformerCount + ' 台，共 ' + detail.transformerKVA + ' kVA' : '—' }}</span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">是否具备接入间隔</span>
                      <span class="info-value">{{ INTERVAL_LABEL[detail.hasInterval] || '—' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 光伏设备放置及布线条件 -->
                <div class="info-section">
                  <div class="info-section-title">光伏设备放置及布线条件</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">光伏设备放置条件</span>
                      <span class="info-value">
                        <template v-if="detail.hasIndoorSpace === 'yes'">有室内空间，{{ detail.indoorLength }}m × {{ detail.indoorWidth }}m</template>
                        <template v-else-if="detail.hasIndoorSpace === 'no'">无室内放置空间</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">场内电缆管道情况</span>
                      <span class="info-value">{{ CABLE_PIPE_LABEL[detail.hasCablePipe] || '—' }}{{ detail.hasCablePipe === 'yes' && detail.cablePipeType ? '（' + CABLE_TYPE_LABEL[detail.cablePipeType] + '）' : '' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 勘察照片 -->
                <div class="info-section">
                  <div class="info-section-title">勘察照片</div>
                  <a-row :gutter="[24, 16]">
                    <a-col v-for="cat in PHOTO_CATEGORIES" :key="cat.key" :span="12">
                      <div class="photo-readonly-col">
                        <span class="photo-readonly-label">{{ cat.label }}</span>
                        <div class="photo-readonly-imgs">
                          <template v-if="detail.photos[cat.key]?.length">
                            <a-image v-for="(img, i) in detail.photos[cat.key]" :key="i" :src="img"
                              :width="80" :height="80" style="object-fit:cover;border-radius:4px" />
                          </template>
                          <span v-else class="empty-hint">—</span>
                        </div>
                      </div>
                    </a-col>
                  </a-row>
                </div>

                <!-- 项目图纸及用电情况 -->
                <div class="info-section">
                  <div class="info-section-title">项目图纸及用电情况</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2">
                      <span class="info-label">图纸</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.drawingFiles?.length" :files="detail.drawingFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">用电情况</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.electricityFiles?.length" :files="detail.electricityFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 接入批复 -->
                <div class="info-section">
                  <div class="info-section-title">接入批复</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2">
                      <span class="info-label">接入批复</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.approvalFiles?.length" :files="detail.approvalFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </a-tab-pane>

            <!-- ──────── 设计 TAB ──────── -->
            <a-tab-pane key="design" tab="设计">
              <div class="tab-body tab-body--design">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">甲供 BOM</div>
                  <a-table :columns="jiagongReadonlyColumns" :data-source="detail.jiagongBom" :pagination="false" size="small" :locale="{ emptyText: '暂无甲供物料' }" />
                </div>
                <div class="info-section">
                  <div class="info-section-title">乙供中高/低压 BOM</div>
                  <a-table :columns="yigongReadonlyColumns" :data-source="detail.yigongBom" :pagination="false" size="small" :locale="{ emptyText: '暂无乙供中/低压物料' }" />
                </div>
                <div class="info-section">
                  <div class="info-section-title">上网模式</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">上网模式</span>
                      <span class="info-value">{{ GRID_MODE_LABEL[detail.gridMode] || '—' }}</span>
                    </div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title" style="margin-bottom:8px">应用场景</div>
                  <div style="font-size:14px;color:rgba(0,0,0,0.65);margin-bottom:12px">
                    应用场景是否混装 {{ detail.scenes.length > 1 ? '是' : '否' }}
                  </div>
                  <a-table
                    :columns="sceneColumns"
                    :data-source="detail.scenes"
                    :pagination="false"
                    size="small"
                  />
                </div>
                <div class="info-section">
                  <div class="info-section-title">设计附件</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2">
                      <span class="info-label">设计资质</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.designQualFiles?.length" :files="detail.designQualFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">电气设计图</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.electricalDesignFiles?.length" :files="detail.electricalDesignFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">结构设计图</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.structuralDesignFiles?.length" :files="detail.structuralDesignFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">厂房结构安全性评估</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.safetyAssessFiles?.length" :files="detail.safetyAssessFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">其他附件</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.otherAttachFiles?.length" :files="detail.otherAttachFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 商务 TAB ──────── -->
            <a-tab-pane key="commercial" tab="商务">
              <div class="tab-body tab-body--commercial">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">合同信息</div>

                  <!-- EMC协议 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">EMC协议（能源管理合同）</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.emcContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.emcContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.emcContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.emcContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.emcContract.amount != null ? detail.commercial.emcContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.emcContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.emcContract.remark || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.emcContract.files?.length" :files="detail.commercial.emcContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 小E施工承包合同 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">小E施工承包合同（常规EMC）</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.smallEContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.smallEContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.smallEContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.smallEContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.smallEContract.amount != null ? detail.commercial.smallEContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.smallEContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.smallEContract.remark || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人姓名</span><span class="info-value">{{ detail.commercial.smallEContract.controllerName || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人身份证号</span><span class="info-value">{{ detail.commercial.smallEContract.controllerIdCard || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人配偶姓名</span><span class="info-value">{{ detail.commercial.smallEContract.controllerSpouseName || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人配偶身份证号</span><span class="info-value">{{ detail.commercial.smallEContract.controllerSpouseIdCard || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.smallEContract.files?.length" :files="detail.commercial.smallEContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 设计合同 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">设计合同</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.designContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.designContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.designContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.designContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.designContract.amount != null ? detail.commercial.designContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.designContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.designContract.remark || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.designContract.files?.length" :files="detail.commercial.designContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 监理合同 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">监理合同</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.jianliContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.jianliContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.jianliContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.jianliContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.jianliContract.amount != null ? detail.commercial.jianliContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.jianliContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.jianliContract.remark || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.jianliContract.files?.length" :files="detail.commercial.jianliContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 其他合同 -->
                  <template v-if="detail.commercial.otherContracts?.length">
                    <div v-for="(c, idx) in detail.commercial.otherContracts" :key="idx" class="contract-block-ro">
                      <div class="contract-block-ro-header">其他合同{{ idx + 1 }}</div>
                      <div class="info-grid">
                        <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ c.contractNo || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ c.paymentCategory || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ c.partyA || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ c.partyB || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ c.amount != null ? c.amount + ' 元' : '—' }}</span></div>
                        <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ c.signDate || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ c.remark || '—' }}</span></div>
                      </div>
                    </div>
                  </template>
                </div>

                <div v-if="props.policyType !== 'nonstandard'" class="info-section">
                  <div class="info-section-title">付款节点<span class="section-sub" style="margin-left:8px">标准政策自动匹配</span></div>
                  <div class="payment-nodes">
                    <div v-for="node in STANDARD_PAYMENT_NODES" :key="node.key" class="payment-node-row">
                      <span class="payment-node-label">{{ node.label }}</span>
                      <span class="payment-node-pct">{{ node.pct }}%</span>
                      <span class="payment-node-desc">{{ node.desc }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 备案 TAB ──────── -->
            <a-tab-pane key="record" tab="备案">
              <div class="tab-body">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">备案证信息</div>
                  <template v-if="detail.filingCert">
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">备案证文件名</span>
                        <span class="info-value">{{ detail.filingCert.fileName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案类型</span>
                        <span class="info-value">{{ detail.filingCert.filingType }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证项目名称</span>
                        <span class="info-value">{{ detail.filingCert.projectName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证项目代码</span>
                        <span class="info-value">{{ detail.filingCert.projectCode }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">产权公司</span>
                        <span class="info-value">{{ detail.filingCert.ownershipCompany }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证编号</span>
                        <span class="info-value">{{ detail.filingCert.certNo }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证容量(W)</span>
                        <span class="info-value">{{ detail.filingCert.capacity }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证类型</span>
                        <span class="info-value">{{ detail.filingCert.certType }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证批复时间</span>
                        <span class="info-value">{{ detail.filingCert.approvalDate }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">发文机关</span>
                        <span class="info-value">{{ detail.filingCert.issuingAuthority }}</span>
                      </div>
                      <div class="info-item info-item--span2">
                        <span class="info-label">备案证批复内容</span>
                        <span class="info-value">{{ detail.filingCert.approvalContent }}</span>
                      </div>
                      <div class="info-item info-item--span2">
                        <span class="info-label">备案证附件</span>
                        <span class="info-value">
                          <FileAttachmentView v-if="detail.filingCert.attachmentName" :files="[detail.filingCert.attachmentName]" />
                          <span v-else>—</span>
                        </span>
                      </div>
                    </div>
                  </template>
                  <span v-else class="empty-hint">暂未关联备案证</span>
                </div>
              </div>
            </a-tab-pane>

            <!-- 开工（只读） -->
            <a-tab-pane key="start" tab="开工" force-render>
              <div class="tab-body">

                <!-- 开工信息 -->
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">开工信息</div>
                  <div class="info-grid">
                    <div class="info-item"><span class="info-label">现场负责人</span><span class="info-value">{{ detail.startInfo.siteManager || '—' }}</span></div>
                    <div class="info-item"><span class="info-label">负责人电话</span><span class="info-value">{{ detail.startInfo.siteManagerPhone || '—' }}</span></div>
                    <div class="info-item"><span class="info-label">开工日期</span><span class="info-value">{{ detail.startInfo.startDate || '—' }}</span></div>
                  </div>
                </div>

                <!-- 工程资料 -->
                <div class="info-section">
                  <div class="info-section-title">工程资料</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2"><span class="info-label">中高压施工单位保险</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.insuranceFiles?.length" :files="detail.startInfo.insuranceFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">质量安全技术交底</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.safetyDisclosureFiles?.length" :files="detail.startInfo.safetyDisclosureFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">其他</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.engineeringOtherFiles?.length" :files="detail.startInfo.engineeringOtherFiles" /><span v-else>—</span></span></div>
                  </div>
                </div>

                <!-- 技术资料 -->
                <div class="info-section">
                  <div class="info-section-title">技术资料</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2"><span class="info-label">技术交底</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.techDisclosureFiles?.length" :files="detail.startInfo.techDisclosureFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">设备技术协议</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.equipmentAgreementFiles?.length" :files="detail.startInfo.equipmentAgreementFiles" /><span v-else>—</span></span></div>
                    <div class="info-item info-item--span2"><span class="info-label">其他</span><span class="info-value"><FileAttachmentView v-if="detail.startInfo.techOtherFiles?.length" :files="detail.startInfo.techOtherFiles" /><span v-else>—</span></span></div>
                  </div>
                </div>

                <!-- 施工人员 -->
                <div class="info-section">
                  <div class="info-section-title">施工人员</div>
                  <a-table
                    :data-source="detail.startInfo.personnel"
                    :columns="personnelColumns"
                    :pagination="false"
                    size="small"
                    row-key="id"
                    :locale="{ emptyText: '暂无施工人员' }"
                  >
                    <template #bodyCell="{ column }">
                      <template v-if="column.key === 'action'">
                        <a-button type="link" size="small" @click="message.info('跳转到人才详情页')">详情</a-button>
                      </template>
                    </template>
                  </a-table>
                </div>

              </div>
            </a-tab-pane>

            <!-- 到货 -->
            <a-tab-pane key="stock" tab="到货">
              <div class="tab-body">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">
                    到货信息
                    <a-tag v-if="approvedArrivalTag === '全部到货'" color="success" style="margin:0 0 0 8px">全部到货</a-tag>
                    <a-tag v-else-if="approvedArrivalTag === '部分到货'" color="processing" style="margin:0 0 0 8px">部分到货</a-tag>
                    <span style="flex:1"></span>
                    <a-button size="small" @click="showStockStatDrawer = true">到货统计</a-button>
                    <a-tooltip v-if="canEdit" :title="disableNewStock ? '已提交全部到货，不可再次新增' : ''">
                      <a-button type="primary" size="small" :disabled="disableNewStock" @click="showStockDrawer = true">新增到货</a-button>
                    </a-tooltip>
                  </div>
                  <a-empty v-if="sharedStockRecords.length === 0" description="暂无到货记录" style="padding:24px 0" />
                  <div v-for="record in sortedStockRecords" :key="record.id" class="payment-contract-card">
                    <div
                      class="payment-contract-header"
                      style="display:flex;justify-content:space-between;align-items:flex-start;cursor:pointer"
                      :style="collapsedStockCards.has(record.id) ? { borderBottom: 'none' } : {}"
                      @click="toggleStockCard(record.id)"
                    >
                      <div>
                        <div class="payment-contract-type" style="display:flex;align-items:center;gap:8px">
                          {{ record.orderNo }}
                          <a-tag v-if="record.status" :color="STOCK_STATUS_COLOR[record.status]" style="margin:0">{{ STOCK_STATUS_LABEL[record.status] }}</a-tag>
                          <span
                            v-if="record.status === 'rejected'"
                            style="font-size:12px;color:#1677ff;cursor:pointer;white-space:nowrap;line-height:1"
                            @click.stop="openRejectDetail(record)"
                          >不通过原因<RightOutlined style="font-size:10px;margin-left:2px;vertical-align:middle" /></span>
                        </div>
                        <div class="payment-contract-meta-row" style="margin-top:8px">
                          <span class="payment-meta-item">
                            <span class="payment-meta-label">物料类型</span>
                            <span class="payment-meta-value">{{ record.materialType }}</span>
                          </span>
                          <span v-if="record.receiver" class="payment-meta-item">
                            <span class="payment-meta-label">签收人</span>
                            <span class="payment-meta-value">{{ record.receiver }}</span>
                          </span>
                          <span v-if="record.receiverPhone" class="payment-meta-item">
                            <span class="payment-meta-label">签收人电话</span>
                            <span class="payment-meta-value">{{ record.receiverPhone }}</span>
                          </span>
                          <span v-if="record.signStatus" class="payment-meta-item">
                            <span class="payment-meta-label">签收状态</span>
                            <span class="payment-meta-value">{{ SIGN_STATUS_LABEL[record.signStatus] }}</span>
                          </span>
                          <span v-if="record.signTime" class="payment-meta-item">
                            <span class="payment-meta-label">签收时间</span>
                            <span class="payment-meta-value">{{ record.signTime }}</span>
                          </span>
                          <span v-if="record.remark" class="payment-meta-item">
                            <span class="payment-meta-label">备注</span>
                            <span class="payment-meta-value">{{ record.remark }}</span>
                          </span>
                          <span class="payment-meta-item">
                            <span class="payment-meta-label">创建人</span>
                            <span class="payment-meta-value">{{ record.creator }}</span>
                          </span>
                          <span class="payment-meta-item">
                            <span class="payment-meta-label">创建时间</span>
                            <span class="payment-meta-value">{{ record.createTime }}</span>
                          </span>
                        </div>
                      </div>
                      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                        <span v-if="['waiting_stock', 'reviewing_stock', 'partial_stock_rejected', 'full_stock_rejected'].includes(detail.filingStatus) && record.status !== 'voided'" @click.stop>
                          <a-popconfirm title="确认作废该到货单？" ok-text="确认" cancel-text="取消" @confirm="record.status = 'voided'">
                            <a-button size="small" danger>作废</a-button>
                          </a-popconfirm>
                        </span>
                        <a-button
                          v-if="record.status === 'rejected'"
                          size="small"
                          @click.stop="openEditDrawer(record)"
                        >修改</a-button>
                        <DownOutlined class="section-toggle-icon" :class="{ rotated: collapsedStockCards.has(record.id) }" />
                      </div>
                    </div>
                    <table v-show="!collapsedStockCards.has(record.id)" class="payment-ratio-table" style="border-top:1px solid #f0f0f0">
                      <thead>
                        <tr>
                          <th style="width:48px">序号</th>
                          <th style="width:72px">类型</th>
                          <th style="width:90px">物料编号</th>
                          <th style="width:160px">物料描述</th>
                          <th style="width:48px">单位</th>
                          <th style="width:72px">设计数量</th>
                          <th style="width:90px">本次到货数量</th>
                          <th style="width:100px">剩余到货数量</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, idx) in record.items" :key="item.code">
                          <td>{{ idx + 1 }}</td>
                          <td>{{ item.type }}</td>
                          <td>{{ item.code }}</td>
                          <td>{{ item.name }}</td>
                          <td>{{ item.unit }}</td>
                          <td>{{ item.designQty }}</td>
                          <td>{{ item.arrivedQty ?? '—' }}</td>
                          <td style="color:#ff4d4f;font-weight:500">{{ Math.max(0, item.pendingQty - (item.arrivedQty ?? 0)) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </a-tab-pane>

          </a-tabs>
        </div>
      </div>

    </div>
  </div>

  <!-- 到货统计 Drawer -->
  <a-drawer v-model:open="showStockStatDrawer" title="到货统计" :width="900" :destroy-on-close="false">
    <div class="stat-drawer-body">
    <a-table
      class="stat-table"
      :data-source="stockStatRows"
      :columns="stockStatColumns"
      :pagination="false"
      size="small"
      row-key="code"
      :scroll="{ y: 'calc(100vh - 120px)' }"
      :locale="{ emptyText: '暂无到货数据' }"
      :row-class-name="(record: any) => record.arrivedQty >= record.designQty ? 'stat-row-done' : ''"
    />
    </div>
  </a-drawer>

  <!-- 新增到货 Drawer -->
  <a-drawer
    v-model:open="showStockDrawer"
    :width="860"
    :destroy-on-close="true"
    @close="handleCloseStockDrawer"
  >
    <template #title>
      <span style="display:flex;align-items:center;gap:8px">
        {{ editingStockRecord ? '修改到货' : '新增到货' }}
        <span v-if="editingStockRecord" style="font-size:13px;color:#8c8c8c">{{ editingStockRecord.orderNo }}</span>
      </span>
    </template>
    <a-form ref="stockNewFormRef" :model="stockNewForm" :colon="false" layout="vertical">

      <div class="info-section-title" style="margin-top:0">基本信息</div>
      <a-row :gutter="[24, 0]">
        <a-col :span="8">
          <a-form-item label="物料类型" name="materialType"
            :rules="[{ required: true, type: 'array', min: 1, message: '请选择物料类型' }]">
            <a-select
              v-model:value="stockNewForm.materialType"
              mode="multiple"
              placeholder="请选择"
            >
              <a-select-option value="中高压">中高压</a-select-option>
              <a-select-option value="低压">低压</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="签收人" name="receiver"
            :rules="[{ required: true, message: '请输入签收人' }]">
            <a-input v-model:value="stockNewForm.receiver" placeholder="请输入" :maxlength="30" />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="签收人电话" name="receiverPhone"
            :rules="[
              { required: true, message: '请输入签收人电话' },
              { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }
            ]">
            <a-input v-model:value="stockNewForm.receiverPhone" placeholder="请输入" :maxlength="11" />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="签收状态" name="signStatus">
            <a-select v-model:value="stockNewForm.signStatus" placeholder="请选择">
              <a-select-option value="signed">已签收</a-select-option>
              <a-select-option value="unsigned">未签收</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="签收时间" name="signTime">
            <a-date-picker v-model:value="stockNewForm.signTime" style="width:100%" format="YYYY-MM-DD" placeholder="请选择" />
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item label="备注" name="remark">
            <a-textarea v-model:value="stockNewForm.remark" placeholder="200字符以内" :maxlength="200" :rows="2" :show-count="true" />
          </a-form-item>
        </a-col>
      </a-row>

      <div class="info-section-title">选择到货</div>
      <a-table
        :data-source="stockNewItems"
        :columns="stockNewColumns"
        :pagination="false"
        size="small"
        row-key="id"
        :locale="{ emptyText: stockNewForm.materialType.length ? '该类型暂无 BOM 物料' : '请先选择物料类型' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'arrivedQty'">
            <a-input-number
              v-model:value="record.arrivedQty"
              :min="0"
              :precision="0"
              size="small"
              style="width:90px"
            />
          </template>
          <template v-if="column.key === 'attachment'">
            <a-button
              type="link"
              size="small"
              @click="openAttachModal(record)"
            >
              附件{{ attachTotalCount(record) > 0 ? `(${attachTotalCount(record)})` : '' }}
            </a-button>
          </template>
        </template>
      </a-table>

    </a-form>

    <template #footer>
      <a-space>
        <a-button @click="handleCloseStockDrawer">取消</a-button>
        <a-button type="primary" @click="handleSubmitStock">{{ editingStockRecord ? '重新提交' : '提交新增到货' }}</a-button>
      </a-space>
    </template>
  </a-drawer>

  <!-- 附件上传 Modal -->
  <a-modal
    v-model:open="attachModalVisible"
    :title="`上传附件 — ${attachModalRow?.name ?? ''}`"
    :width="520"
    ok-text="确定"
    cancel-text="取消"
    :destroy-on-close="false"
    @ok="attachModalVisible = false"
    @cancel="attachModalVisible = false"
  >
    <div v-if="attachModalRow" class="attach-modal-body">
      <div v-for="cat in ATTACH_CATEGORIES" :key="cat.key" class="attach-group">
        <div class="attach-group-label">
          <span v-if="cat.required" class="attach-req">*</span>{{ cat.label }}
          <a-tooltip title="支持图片、PDF，最多 5 个"><QuestionCircleOutlined class="upload-hint-icon" /></a-tooltip>
        </div>
        <a-upload
          v-model:file-list="attachModalRow.attach[cat.key]"
          :before-upload="() => false"
          accept=".jpg,.jpeg,.png,.pdf"
          :max-count="5"
          multiple
          list-type="text"
        >
          <a-button
            size="small"
            :disabled="attachModalRow.attach[cat.key].length >= 5"
          >
            上传文件
          </a-button>
        </a-upload>
      </div>
    </div>
  </a-modal>

  <!-- 审核不通过详情弹窗 -->
  <a-modal
    v-model:open="rejectDetailVisible"
    title="审核不通过详情"
    :footer="null"
    width="520px"
    destroy-on-close
  >
    <div v-if="rejectDetailEntry" style="padding:4px 0">
      <div v-if="rejectDetailEntry.items?.length" style="margin-bottom:16px">
        <div
          v-for="r in rejectDetailEntry.items"
          :key="r"
          style="padding:4px 0;color:#262626;font-size:14px"
        >· {{ r }}</div>
      </div>
      <div v-if="rejectDetailEntry.images?.length">
        <div style="font-weight:600;margin-bottom:8px;color:#262626">图片</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <img
            v-for="(src, i) in rejectDetailEntry.images"
            :key="i"
            :src="src"
            style="width:152px;height:114px;object-fit:cover;border-radius:4px;border:1px solid #f0f0f0;cursor:pointer"
          />
        </div>
      </div>
    </div>
  </a-modal>

</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick, onMounted, onBeforeUnmount, h } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { sharedStockRecords, initDemoStockRecords, hasUserSubmittedRecords, type StockRecord } from '../stores/stockRecords'
import { stationStatusOverrides } from '../stores/stationStatus'
import FileAttachmentView from '../components/FileAttachmentView.vue'
import {
  LeftOutlined, CalendarOutlined, CopyOutlined,
  CheckCircleOutlined, CloseCircleOutlined, EditOutlined, FileAddOutlined,
  AuditOutlined, HolderOutlined, DownOutlined, QuestionCircleOutlined, RightOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{ editId?: string | null; initStatus?: string | null; initData?: Record<string, any> | null }>()
const emit = defineEmits<{ back: [] }>()

const projectInfoOpen = ref(false)

const collapsedStockCards = reactive(new Set<string>())
function toggleStockCard(id: string) {
  if (collapsedStockCards.has(id)) collapsedStockCards.delete(id)
  else collapsedStockCards.add(id)
}


function copyStationNo(no: string) {
  navigator.clipboard.writeText(no).then(() => message.success('已复制'))
}

// ── 到货统计 Drawer ──
const showStockStatDrawer = ref(false)

const stockStatRows = computed(() => {
  return detail.value.yigongBom.map(b => {
    const arrived = sharedStockRecords.filter(rec => rec.status === 'approved').reduce((sum, rec) => {
      const matched = rec.items.find(i => i.code === b.code)
      return sum + (matched?.arrivedQty ?? 0)
    }, 0)
    return {
      code:       b.code,
      name:       b.name,
      type:       b.type,
      unit:       b.unit,
      designQty:  b.quantity,
      arrivedQty: arrived,
      pendingQty: Math.max(0, b.quantity - arrived),
    }
  })
})

const stockStatColumns = [
  { title: '序号',       key: 'index',      width: 56,  customRender: ({ index }: any) => index + 1 },
  { title: '到货类型',   dataIndex: 'type', key: 'type',       width: 90  },
  { title: '物料编号',   dataIndex: 'code', key: 'code',       width: 110 },
  { title: '物料描述',   dataIndex: 'name', key: 'name' },
  { title: '单位',       dataIndex: 'unit', key: 'unit',       width: 56  },
  { title: '设计数量',   dataIndex: 'designQty',  key: 'designQty',  width: 90 },
  {
    title: '未到货数量', dataIndex: 'pendingQty', key: 'pendingQty', width: 100,
    customRender: ({ record }: any) => {
      const v = record.pendingQty
      return h('span', { style: 'color:#ff4d4f;font-weight:500' }, v)
    },
  },
  {
    title: '到货数量', dataIndex: 'arrivedQty', key: 'arrivedQty', width: 90,
    customRender: ({ record }: any) => {
      const v = record.arrivedQty
      const done = v >= record.designQty
      return h('span', { style: done ? 'color:#52c41a;font-weight:500' : '' }, v)
    },
  },
]

// ── 新增/修改到货 Drawer ──
const showStockDrawer     = ref(false)
const editingStockRecord  = ref<StockRecord | null>(null)
const stockNewFormRef     = ref()

const stockNewForm = reactive({
  materialType:  [] as string[],
  receiver:      '',
  receiverPhone: '',
  signTime:      null as any,
  signStatus:    null as string | null,
  remark:        '',
})

type AttachKey = 'daohuo' | 'chuchang' | 'qianshou' | 'other'
const ATTACH_CATEGORIES: { key: AttachKey; label: string; required: boolean }[] = [
  { key: 'daohuo',   label: '到货照片', required: false },
  { key: 'chuchang', label: '出厂资料', required: false },
  { key: 'qianshou', label: '签收单',   required: false },
  { key: 'other',    label: '其他',     required: false },
]

function makeAttach() {
  return { daohuo: [] as any[], chuchang: [] as any[], qianshou: [] as any[], other: [] as any[] }
}

const stockNewItems = reactive<{
  id: string; code: string; name: string; type: string; unit: string
  designQty: number; pendingQty: number; arrivedQty: number | null
  attach: Record<AttachKey, any[]>
}[]>([])

const computedArrivalType = ref('')

function recalcArrivalType() {
  if (stockNewItems.length === 0) { computedArrivalType.value = ''; return }
  // 历史到货 + 本次填写，是否覆盖整个 BOM 的设计数量
  const fullyDone = detail.value.yigongBom.every(b => {
    const historyArrived = sharedStockRecords
      .filter(rec => rec.id !== editingStockRecord.value?.id)
      .reduce((sum, rec) => {
        const matched = rec.items.find(i => i.code === b.code)
        return sum + (matched?.arrivedQty ?? 0)
      }, 0)
    const cur = stockNewItems.find(i => i.code === b.code)
    return historyArrived + (cur?.arrivedQty ?? 0) >= b.quantity
  })
  computedArrivalType.value = fullyDone ? '全部到货' : '部分到货'
}

watch(stockNewItems, recalcArrivalType, { deep: true })

watch(() => stockNewForm.materialType, (val) => {
  if (editingStockRecord.value) return  // 编辑模式下 items 由 openEditDrawer 直接填充
  stockNewItems.splice(0)
  computedArrivalType.value = ''
  if (!val || val.length === 0) return
  ;['中高压', '低压'].filter(t => val.includes(t)).forEach(type => {
    detail.value.yigongBom
      .filter(b => b.type === type)
      .forEach(b => {
        const alreadyArrived = sharedStockRecords.reduce((sum, rec) => {
          const matched = rec.items.find(i => i.code === b.code)
          return sum + (matched?.arrivedQty ?? 0)
        }, 0)
        stockNewItems.push({
          id:         b.code,
          code:       b.code,
          name:       b.name,
          type:       b.type,
          unit:       b.unit,
          designQty:  b.quantity,
          pendingQty: Math.max(0, b.quantity - alreadyArrived),
          arrivedQty: null,
          attach:     makeAttach(),
        })
      })
  })
})

// 附件 Modal
const attachModalVisible = ref(false)
const attachModalRow     = ref<typeof stockNewItems[number] | null>(null)

function openAttachModal(record: typeof stockNewItems[number]) {
  attachModalRow.value    = record
  attachModalVisible.value = true
}

function attachTotalCount(record: typeof stockNewItems[number]): number {
  const a = record.attach
  return a.daohuo.length + a.chuchang.length + a.qianshou.length + a.other.length
}

function handleCloseStockDrawer() {
  showStockDrawer.value    = false
  editingStockRecord.value = null
  attachModalVisible.value = false
  attachModalRow.value     = null
  stockNewFormRef.value?.resetFields()
  stockNewItems.splice(0)
  computedArrivalType.value = ''
}

function openEditDrawer(record: StockRecord) {
  editingStockRecord.value = record
  // 设置物料类型（watch 因 editingStockRecord 已设置而跳过）
  stockNewForm.materialType  = record.materialType.split('、')
  stockNewForm.receiver      = record.receiver      ?? ''
  stockNewForm.receiverPhone = record.receiverPhone ?? ''
  stockNewForm.signStatus    = record.signStatus    ?? null
  stockNewForm.signTime      = record.signTime ? dayjs(record.signTime) : null
  stockNewForm.remark        = record.remark        ?? ''
  // 直接从记录填充 items，不走 watch 重建
  stockNewItems.splice(0)
  record.items.forEach(item => {
    stockNewItems.push({
      id:         item.code,
      code:       item.code,
      name:       item.name,
      type:       item.type,
      unit:       item.unit,
      designQty:  item.designQty,
      pendingQty: item.pendingQty,
      arrivedQty: item.arrivedQty,
      attach:     makeAttach(),
    })
  })
  recalcArrivalType()
  showStockDrawer.value = true
}

const SIGN_STATUS_LABEL: Record<string, string> = { signed: '已签收', unsigned: '未签收' }

const rejectDetailVisible = ref(false)
const rejectDetailEntry   = ref<{ items: string[]; images: string[] } | null>(null)
function openRejectDetail(record: StockRecord) {
  const allLogs = groupedLogs.value.flatMap(g => g.logs)
  const logEntry = allLogs.find(l => l.type === 'reject' && l.recordId === record.id)
    ?? allLogs.find(l => l.type === 'reject')
  const note = logEntry?.note ?? [...(record.rejectReasons ?? []), record.rejectComment].filter(Boolean).join('；')
  rejectDetailEntry.value = {
    items: note ? note.split('；').filter(Boolean) : [],
    images: logEntry?.images ?? [],
  }
  rejectDetailVisible.value = true
}

const STOCK_STATUS_LABEL: Record<string, string> = {
  reviewing: '审核中',
  approved:  '审核通过',
  rejected:  '审核不通过',
  voided:    '已作废',
}
const STOCK_STATUS_COLOR: Record<string, string> = {
  reviewing: 'processing',
  approved:  'success',
  rejected:  'error',
  voided:    'default',
}

async function handleSubmitStock() {
  try {
    await stockNewFormRef.value?.validate()
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const submitTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`

    // ── 编辑模式：更新已有到货单并重新提交 ──
    if (editingStockRecord.value) {
      const rec = sharedStockRecords.find(r => r.id === editingStockRecord.value!.id)
      if (rec) {
        rec.materialType  = stockNewForm.materialType.join('、')
        rec.arrivalType   = computedArrivalType.value
        rec.items         = stockNewItems.filter(r => r.arrivedQty !== null && r.arrivedQty > 0).map(r => ({
          type: r.type, code: r.code, name: r.name, unit: r.unit,
          designQty: r.designQty, pendingQty: r.pendingQty, arrivedQty: r.arrivedQty,
        }))
        rec.status        = 'reviewing'
        rec.rejectReasons = []
        rec.rejectComment = ''
        rec.createTime    = submitTime
        rec.receiver      = stockNewForm.receiver      || undefined
        rec.receiverPhone = stockNewForm.receiverPhone || undefined
        rec.signStatus    = stockNewForm.signStatus    || undefined
        rec.signTime      = stockNewForm.signTime?.format?.('YYYY-MM-DD') || undefined
        rec.remark        = stockNewForm.remark        || undefined
      }
      detail.value.filingStatus = 'reviewing_stock'
      const stationId = props.editId ?? props.initData?.id
      if (stationId) stationStatusOverrides['b:' + stationId] = 'reviewing_stock'
      message.success('已重新提交，等待审核')
      handleCloseStockDrawer()
      return
    }

    // ── 新增模式 ──
    const orderNo = `DH-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${String(Date.now()).slice(-4)}`
    sharedStockRecords.push({
      id:           `SR-${Date.now()}`,
      orderNo,
      materialType: stockNewForm.materialType.join('、'),
      arrivalType:  computedArrivalType.value,
      status:       'reviewing',
      creator:      '张三',
      createTime:   submitTime,
      receiver:      stockNewForm.receiver      || undefined,
      receiverPhone: stockNewForm.receiverPhone || undefined,
      signStatus:    stockNewForm.signStatus    || undefined,
      signTime:      stockNewForm.signTime?.format?.('YYYY-MM-DD') || undefined,
      remark:        stockNewForm.remark        || undefined,
      items: stockNewItems.filter(r => r.arrivedQty !== null && r.arrivedQty > 0).map(r => ({
        type:       r.type,
        code:       r.code,
        name:       r.name,
        unit:       r.unit,
        designQty:  r.designQty,
        pendingQty: r.pendingQty,
        arrivedQty: r.arrivedQty,
      })),
    })
    detail.value.filingStatus = 'reviewing_stock'
    const stationId = props.editId ?? props.initData?.id
    if (stationId) stationStatusOverrides["b:" + stationId] = "reviewing_stock"
    hasUserSubmittedRecords.value = true
    message.success('到货记录已经提交')
    handleCloseStockDrawer()
  } catch {}
}

const stockNewColumns = [
  { title: '序号',         key: 'index',      width: 56,  customRender: ({ index }: any) => index + 1 },
  { title: '到货类型',     dataIndex: 'type', key: 'type',       width: 80  },
  { title: '物料编号',     dataIndex: 'code', key: 'code',       width: 100 },
  { title: '物料描述',     dataIndex: 'name', key: 'name',       width: 160 },
  { title: '单位',         dataIndex: 'unit', key: 'unit',       width: 56  },
  { title: '设计数量',     dataIndex: 'designQty',  key: 'designQty',  width: 80 },
  { title: '未到货数量', dataIndex: 'pendingQty', key: 'pendingQty', width: 90,
    customRender: ({ record }: any) => h('span', { style: 'color:#ff4d4f;font-weight:500' }, record.pendingQty) },
  { title: '本次到货数量', key: 'arrivedQty', width: 120 },
  { title: '附件',         key: 'attachment', width: 80 },
]

// 开工 tab 施工人员列（与到货详情页保持一致）
const personnelColumns = [
  { title: '序号',   key: 'index',          width: 60,  customRender: ({ index }: any) => index + 1 },
  { title: '姓名',   dataIndex: 'name',     key: 'name' },
  { title: '岗位',   dataIndex: 'position', key: 'position' },
  { title: '手机号', dataIndex: 'phone',    key: 'phone' },
  { title: '操作',   key: 'action',         width: 80 },
]

const detailBodyRef   = ref<HTMLElement | null>(null)
const tabsWrapperRef  = ref<HTMLElement | null>(null)
const tabsStuck       = ref(false)
const scrollPad       = ref(0)

async function scrollToTabNav() {
  // ① 等新 tab 内容渲染完，再量尺寸
  await nextTick()

  const body    = detailBodyRef.value
  const wrapper = tabsWrapperRef.value
  if (!body || !wrapper) return

  // ② 提前锁定 stuck 状态，等 tab-bar 高度稳定后再量 target
  tabsStuck.value = true
  await nextTick()

  const target = Math.round(
    wrapper.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop
  )

  // ③ 用"去掉当前 scrollPad 的真实内容高"算需要多少 pad
  //    原公式 depth = scrollHeight - clientHeight 当内容比 viewport 矮时是负数，算出的 pad 不够
  //    正确：需要 scrollHeight + neededPad - clientHeight >= target
  //         → neededPad >= target - naturalScrollHeight + clientHeight
  const naturalScrollHeight = body.scrollHeight - scrollPad.value
  const neededPad = Math.max(0, target - naturalScrollHeight + body.clientHeight + 20)

  if (neededPad !== scrollPad.value) {
    scrollPad.value = neededPad
    await nextTick()
  }

  body.scrollTop = target
}

let _scrollHandler: (() => void) | null = null
onMounted(() => {
  // 按当前状态预填 demo 记录（sharedStockRecords 非空时跳过，避免重复注入）
  initDemoStockRecords(detail.value.filingStatus, detail.value.yigongBom)
  _scrollHandler = () => {
    const body    = detailBodyRef.value
    const wrapper = tabsWrapperRef.value
    if (!body || !wrapper) return
    tabsStuck.value = wrapper.getBoundingClientRect().top <= body.getBoundingClientRect().top + 1
    if (!tabsStuck.value && body.scrollTop <= 1) scrollPad.value = 0
  }
  detailBodyRef.value?.addEventListener('scroll', _scrollHandler, { passive: true })
})
onBeforeUnmount(() => {
  if (_scrollHandler) detailBodyRef.value?.removeEventListener('scroll', _scrollHandler)
})



// ─── 常量 ────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  waiting_stock: 'default',
  reviewing_stock: 'processing', partial_stock: 'cyan',
  partial_stock_rejected: 'error', full_stock_rejected: 'error',
  full_stock: 'success', stocked: 'success',
}
const STATUS_LABEL: Record<string, string> = {
  waiting_stock: '待到货',
  reviewing_stock: '到货审核中', partial_stock: '部分已到货',
  partial_stock_rejected: '部分到货审核不通过', full_stock_rejected: '全部到货审核不通过',
  full_stock: '全部已到货', stocked: '已到货',
}
const SUB_STATUS_LABEL: Record<string, string> = {}
const SUB_STATUS_COLOR: Record<string, string> = {}
const PROJECT_TYPE_LABEL: Record<string, string> = { emc: '常规 EMC', public_emc: '公建 EMC' }
const GRID_VOLTAGE_LABEL: Record<string, string> = { low: '低压', high: '中高压' }
const PUBLIC_BUILD_TYPE_LABEL: Record<string, string> = {
  education:    '科教文体公建',
  medical:      '医疗卫生公建',
  government:   '党政政务机构',
  enforcement:  '执法监管机构',
  public_welfare:'公益事业单位机构',
  other:        '其他',
}
const GRID_MODE_LABEL: Record<string, string> = {
  full: '全额上网', surplus: '余电上网',
  surplus_no_grid: '余电不上网', offgrid: '离网',
}
const STEEL_ROOF_LABEL: Record<string, string> = {
  standing_seam: '直立锁边型', angle_drive: '角驰型', trapezoidal: '梯型',
}
const RUST_LABEL: Record<string, string> = {
  none: '无锈蚀', light: '局部轻度锈蚀', severe: '严重锈蚀',
}
const INLET_CONN_LABEL: Record<string, string> = {
  dedicated: '专线接入', tee: 'T接接入',
}
const INTERVAL_LABEL: Record<string, string> = {
  yes: '有，需落实备用间隔是否可给光伏',
  space: '无，但有安装间隔的空间',
  no: '无',
}
const CABLE_PIPE_LABEL: Record<string, string> = {
  yes: '有', no_green: '无，有绿化带可直埋', no_road: '无，需破场内硬化道路',
}
const CABLE_TYPE_LABEL: Record<string, string> = {
  trench: '电缆沟', conduit: '电缆排管', other: '其它',
}
const LOG_ICON: Record<string, any> = {
  create:  FileAddOutlined,
  submit:  CheckCircleOutlined,
  reject:  CloseCircleOutlined,
  approve: CheckCircleOutlined,
  void:    EditOutlined,
}
const LOG_TAG_LABEL: Record<string, string> = {
  create:  '创建',
  submit:  '已提交',
  reject:  '不通过',
  approve: '已通过',
  void:    '已作废',
}
const PHOTO_CATEGORIES = [
  { key: 'exterior', label: '外观照片' },
  { key: 'roof',     label: '屋顶照片' },
  { key: 'meter',    label: '电表照片' },
  { key: 'inverter', label: '逆变器位置' },
  { key: 'other',    label: '其他' },
]
const STANDARD_PAYMENT_NODES = [
  { key: 'start',    label: '开工款',    pct: 30, desc: '开工验收后 15 个工作日内到账' },
  { key: 'grid',     label: '并网款',    pct: 30, desc: '并网验收后 15 个工作日内到账' },
  { key: 'complete', label: '竣工验收款', pct: 30, desc: '竣工验收后 15 个工作日内到账' },
  { key: 'warranty', label: '质保金',    pct: 10, desc: '质保期满后 30 个工作日内到账' },
]

// ─── mock 数据（接入时替换为接口返回） ───────────────────────────────────────

const detail = ref({
  id: 'LNC-2026-0001',
  filingStatus: (props.initData?.filingStatus ?? props.initStatus ?? 'waiting_stock') as string,
  // 系统信息
  stationType: '工商业',
  stationNo:   props.initData?.stationNo ?? 'LNC-2026-0001',
  // 基本信息
  oaNo: 'A304202607100012',
  projectName: props.initData?.projectName ?? '杭州市滨江区某商业综合体光伏项目',
  projectType: 'emc',
  policyMatched: true,
  division: '安能智电事业部',
  regionCompany: '浙江区域公司',
  region: ['浙江省', '杭州市', '滨江区'],
  addressDetail: '××路×号商业综合体楼顶',
  capacity: 320,
  gridVoltage: 'low',
  // 代理商信息
  agentName: props.initData?.agentName ?? '浙江绿能科技有限公司',
  // 用电企业信息
  userEntName:    '杭州某商业综合体管理有限公司',
  propertyProof:  ['产权证明.pdf'],
  bizLicense:     ['营业执照.pdf'],
  bankAccountCert:'开户许可证.pdf',
  idCardFront:    '身份证正面.jpg',
  idCardBack:     '身份证反面.jpg',
  // 供应商信息
  developerName:   '浙江华电开发有限公司',
  constructorName: '杭州建工集团有限公司',
  supervisorName:  '浙江工程监理有限公司',
  designerName:    '',
  // 合同信息
  emcPrice:        0.6500,
  emcYears:        20,
  consumptionRate: 85,
  // 公建信息（仅 public_emc）
  publicBuildType: null as string | null,
  // 项目产权信息
  projectCompany:   '杭州光伏资产管理有限公司',
  epcCompany:       '杭州安能智电 EPC 有限公司',
  ownershipCompany: '杭州光伏资产管理有限公司',
  // 商务
  commercial: {
    emcContract:    { contractNo: 'EMC-2026-0001', paymentCategory: '应收款项', partyA: '浙江某甲供应商有限公司', partyB: '杭州光伏资产管理有限公司', amount: 1200000, signDate: '2026-03-20', remark: '', files: ['EMC协议.pdf'] },
    smallEContract: { contractNo: 'XE-2026-0001', paymentCategory: '应付款项', partyA: '正泰安能数字能源（浙江）股份有限公司', partyB: '杭州建工集团有限公司', amount: 800000, signDate: '2026-03-22', remark: '', files: ['小E施工合同.pdf'], controllerName: '李四', controllerIdCard: '330102199001011234', controllerSpouseName: '王五', controllerSpouseIdCard: '330102199203021234' },
    designContract: { contractNo: 'DS-2026-0001', paymentCategory: '应付款项', partyA: '正泰安能数字能源（浙江）股份有限公司', partyB: '浙江华电开发有限公司', amount: 50000, signDate: '2026-03-25', remark: '', files: [] },
    jianliContract: { contractNo: 'JL-2026-0001', paymentCategory: '应付款项', partyA: '杭州光伏资产管理有限公司', partyB: '浙江工程监理有限公司', amount: 30000, signDate: '2026-03-28', remark: '', files: [] },
    otherContracts: [],
  },
  // 勘察
  gridMode: 'surplus',
  buildingCount: 3,
  roofLightSteel: 2,
  roofConcrete: 1,
  roofOther: 0,
  siteLayoutFiles: ['总平面布置图.pdf'],
  steelRoofType: 'standing_seam',
  rustCondition: 'light',
  hasObstacle: 'no',
  obstacleHeight: null as number | null,
  obstacleWidth: null as number | null,
  hasSkylight: 'yes',
  skylightWidth: 200,
  inletVoltage: 10,
  inletConnectionType: 'dedicated',
  circuitCount: 2,
  cableSpec: 150,
  transformerCount: 3,
  transformerKVA: 1200,
  hasInterval: 'yes',
  hasIndoorSpace: 'yes',
  indoorLength: 6.5,
  indoorWidth: 4.0,
  hasCablePipe: 'yes',
  cablePipeType: 'trench',
  drawingFiles: ['项目图纸.dwg'],
  electricityFiles: ['用电情况报告.pdf'],
  approvalFiles: ['接入批复文件.pdf'],
  scenes: [
    { type: '屋顶', blocks: 560, tiltAngle: 10, specialPlan: null },
    { type: '车棚', blocks: 220, tiltAngle: 5,  specialPlan: null },
  ],
  photos: {
    exterior: Array.from({ length: 10 }, (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    roof:     Array.from({ length: 4 },  (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    meter:    Array.from({ length: 2 },  (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    inverter: Array.from({ length: 3 },  (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    other:    [],
  },
  jiagongBom: [
    { code: 'M001', name: '单晶硅光伏组件 545W', group: '组件',   unit: '块', quantity: 560 },
    { code: 'M002', name: '组串式逆变器 50kW',   group: '逆变器', unit: '台', quantity: 8 },
  ],
  yigongBom: [
    { code: 'TB0002', name: '400kVA柱上变压器',   type: '中高压', unit: '台', quantity: 2 },
    { code: 'TB0005', name: '10kV真空断路器',      type: '中高压', unit: '台', quantity: 4 },
    { code: 'TB0011', name: '10kV电缆（XLPE）',   type: '中高压', unit: '米', quantity: 120 },
    { code: 'TB0018', name: '环网柜',              type: '中高压', unit: '台', quantity: 1 },
    { code: 'TJ0080', name: '台架变',              type: '低压',   unit: '台', quantity: 1 },
    { code: 'TJ0103', name: '低压配电柜',          type: '低压',   unit: '台', quantity: 3 },
    { code: 'TJ0117', name: '低压电缆（VV）',      type: '低压',   unit: '米', quantity: 200 },
    { code: 'TJ0122', name: '并网逆变器 50kW',     type: '低压',   unit: '台', quantity: 8 },
  ],
  designQualFiles: ['设计资质证书.pdf'],
  electricalDesignFiles: ['电气设计图.dwg'],
  structuralDesignFiles: ['结构设计图.dwg'],
  safetyAssessFiles: [],
  otherAttachFiles: [],
  filingCert: {
    fileName: '杭州滨江综合体光伏备案证',
    filingType: '备案',
    projectName: '杭州市滨江区某商业综合体光伏项目',
    projectCode: 'PJ-2026-0001',
    ownershipCompany: '杭州光伏资产管理有限公司',
    certNo: 'BC-2026-0001',
    capacity: 320000,
    certType: '分布式光伏',
    approvalDate: '2026-03-15',
    issuingAuthority: '杭州市滨江区发展和改革局',
    approvalContent: '同意该项目在滨江区××路×号商业综合体楼顶建设分布式光伏发电项目，装机容量320kW，接入10kV电网。',
    attachmentName: '杭州滨江综合体光伏备案批复文件.pdf',
  },
  rejectInfo: {
    stage: '到货审核',
    reviewer: '李四（安能审核员）',
    time: '2026-08-11 15:30',
    reason: '到货数量与计划不符，请核实后重新提交。',
  },
  startInfo: {
    siteManager:            '张建国',
    siteManagerPhone:       '13812340001',
    startDate:              '2026-08-01',
    insuranceFiles:         ['中高压施工单位保险.pdf'],
    safetyDisclosureFiles:  ['质量安全技术交底.pdf'],
    engineeringOtherFiles:  [] as string[],
    techDisclosureFiles:    ['技术交底.pdf'],
    equipmentAgreementFiles:[] as string[],
    techOtherFiles:         [] as string[],
    personnel: [
      { id: 'p1', name: '张建国', position: '施工队长',   phone: '13812340001' },
      { id: 'p2', name: '李明',   position: '电工',       phone: '13812340002' },
    ],
  },
  logs: [] as { id: number; type: string; event: string; operator: string; time: string; note: string | null; images?: string[]; rejectReasons?: string[]; recordId?: string }[],
})

watch(() => props.initStatus, (val) => {
  if (val) detail.value.filingStatus = val
})

// ─── 状态对应的流转日志 ───────────────────────────────────────────────────────

const LOGS_BY_STATUS: Record<string, typeof detail.value.logs> = {
  waiting_stock: [
    { id: 1, type: 'create', event: '创建到货申请', operator: '张三（代理商）', time: '2026-08-12 09:00', note: null },
  ],
  reviewing_stock: [
    { id: 2, type: 'submit', event: '提交到货申请',  operator: '张三（代理商）', time: '2026-08-12 17:00', note: null },
    { id: 1, type: 'create', event: '创建到货申请',  operator: '张三（代理商）', time: '2026-08-12 09:00', note: null },
  ],
  partial_stock_rejected: [
    { id: 3, type: 'reject', event: '部分到货审核不通过', operator: '李四（审核员）', time: '2026-08-13 10:30', note: '部分物料到货数量不足，请补充', rejectReasons: ['到货数量与计划不符'] },
    { id: 2, type: 'submit', event: '提交到货申请',        operator: '张三（代理商）', time: '2026-08-12 17:00', note: null },
    { id: 1, type: 'create', event: '创建到货申请',        operator: '张三（代理商）', time: '2026-08-12 09:00', note: null },
  ],
  full_stock_rejected: [
    { id: 3, type: 'reject', event: '全部到货审核不通过', operator: '李四（审核员）', time: '2026-08-13 10:30', note: '到货数量与计划不符，请核实后重新提交', rejectReasons: ['到货数量与计划不符'], images: ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2I4YzhkOCIgcng9IjQiLz48dGV4dCB4PSIxMDAiIHk9IjgwIiBmb250LXNpemU9IjE0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7lrqHmoLjlm77niYc8L3RleHQ+PC9zdmc+', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2M4YjhjOCIgcng9IjQiLz48dGV4dCB4PSIxMDAiIHk9IjgwIiBmb250LXNpemU9IjE0IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuOCkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7lrqHmoLjlm77niYc8L3RleHQ+PC9zdmc+'] },
    { id: 2, type: 'submit', event: '提交到货申请',       operator: '张三（代理商）', time: '2026-08-12 17:00', note: null },
    { id: 1, type: 'create', event: '创建到货申请',       operator: '张三（代理商）', time: '2026-08-12 09:00', note: null },
  ],
  stocked: [
    { id: 3, type: 'approve', event: '到货审核通过', operator: '李四（审核员）', time: '2026-08-13 10:00', note: null },
    { id: 2, type: 'submit',  event: '提交到货申请', operator: '张三（代理商）', time: '2026-08-12 17:00', note: null },
    { id: 1, type: 'create',  event: '创建到货申请', operator: '张三（代理商）', time: '2026-08-12 09:00', note: null },
  ],
}

// ─── 日志分组 ─────────────────────────────────────────────────────────────────

const groupedLogs = computed(() => {
  let logs: typeof detail.value.logs

  const submitted = sharedStockRecords.filter(r => r.status !== null)
  if (submitted.length > 0) {
    const recordLogs: typeof detail.value.logs = []
    let nextId = 2
    for (const rec of submitted) {
      const noteArr: string[] = []
      if (rec.rejectReasons?.length) noteArr.push(rec.rejectReasons.join('、'))
      if (rec.rejectComment) noteArr.push(rec.rejectComment)
      recordLogs.push({
        id: nextId++,
        type: 'submit',
        event: `提交到货申请（${rec.orderNo}）`,
        operator: `${rec.creator}（代理商）`,
        time: rec.createTime,
        note: null,
      })
      if (rec.status === 'approved') {
        recordLogs.push({
          id: nextId++,
          type: 'approve',
          event: rec.arrivalType === '全部到货' ? '全部到货审核通过' : '部分到货审核通过',
          operator: '李四（审核员）',
          time: rec.reviewTime ?? rec.createTime,
          note: null,
        })
      } else if (rec.status === 'rejected') {
        recordLogs.push({
          id: nextId++,
          type: 'reject',
          event: rec.arrivalType === '全部到货' ? '全部到货审核不通过' : '部分到货审核不通过',
          operator: '李四（审核员）',
          time: rec.reviewTime ?? rec.createTime,
          note: noteArr.join('；') || null,
          rejectReasons: rec.rejectReasons ?? [],
          images: rec.rejectImages ?? [],
          recordId: rec.id,
        })
      }
    }
    recordLogs.sort((a, b) => b.id - a.id)
    logs = [
      ...recordLogs,
      { id: 1, type: 'create', event: '创建到货申请', operator: '张三（代理商）', time: '2026-08-12 09:00', note: null },
    ]
  } else {
    logs = LOGS_BY_STATUS[detail.value.filingStatus] ?? []
  }

  const map = new Map<string, typeof logs>()
  for (const log of logs) {
    const date = log.time.split(' ')[0]
    if (!map.has(date)) map.set(date, [])
    map.get(date)!.push(log)
  }
  return Array.from(map.entries()).map(([date, logs]) => ({ date, logs }))
})

// ─── 权限 ────────────────────────────────────────────────────────────────────

const sortedStockRecords = computed(() =>
  [...sharedStockRecords].sort((a, b) => b.createTime.localeCompare(a.createTime))
)

const canEdit = computed(() =>
  ['waiting_stock', 'reviewing_stock', 'partial_stock', 'partial_stock_rejected', 'full_stock_rejected'].includes(detail.value.filingStatus)
)
const approvedArrivalTag = computed(() => {
  const approvedRecs = sharedStockRecords.filter(r => r.status === 'approved')
  if (approvedRecs.length === 0) return null
  const bom = detail.value.yigongBom
  if (bom.length === 0) return null
  const allCovered = bom.every(b => {
    const total = approvedRecs.reduce((sum, r) => {
      const item = r.items.find(i => i.code === b.code)
      return sum + (item?.arrivedQty ?? 0)
    }, 0)
    return total >= b.quantity
  })
  return allCovered ? '全部到货' : '部分到货'
})
const allFullyArrived = computed(() =>
  detail.value.yigongBom.length > 0 && detail.value.yigongBom.every(b => {
    const total = sharedStockRecords.filter(r => r.status !== 'voided').reduce((sum, rec) => {
      const m = rec.items.find(i => i.code === b.code)
      return sum + (m?.arrivedQty ?? 0)
    }, 0)
    return total >= b.quantity
  })
)
const hasSubmittedFullArrival = computed(() => {
  const isRejected = ['partial_stock_rejected', 'full_stock_rejected'].includes(detail.value.filingStatus)
  if (isRejected) return false
  return sharedStockRecords.some(r => r.arrivalType === '全部到货' && r.status !== null && r.status !== 'voided')
})
const disableNewStock = computed(() => allFullyArrived.value || hasSubmittedFullArrival.value)
const canVoid = computed(() =>
  detail.value.filingStatus === 'waiting_stock'
)
// 已提交过全部到货（非驳回状态下不可再提交）


// ─── 表格列 ───────────────────────────────────────────────────────────────────

const activeTab = ref('stock')

// ── 合同付款比例（非标详情只读展示）──────────────────────────
const DETAIL_PAYMENT_NODES = ['开工', '并网', '竣工验收', '质保金']
const detailPaymentContracts = computed(() => {
  const c = detail.value.commercial
  const base = [
    { type: '小E施工承包合同（常规EMC）', contractNo: c.smallEContract.contractNo, amount: c.smallEContract.amount, partyA: c.smallEContract.partyA, partyB: c.smallEContract.partyB, settlementType: '施工方',
      nodes: [{ node: '开工', ratio: 30 }, { node: '并网', ratio: 30 }, { node: '竣工验收', ratio: 30 }, { node: '质保金', ratio: 10 }] },
    { type: '设计合同', contractNo: c.designContract.contractNo, amount: c.designContract.amount, partyA: c.designContract.partyA, partyB: c.designContract.partyB, settlementType: '设计院',
      nodes: [{ node: '开工', ratio: 50 }, { node: '并网', ratio: 30 }, { node: '竣工验收', ratio: 20 }, { node: '质保金', ratio: 0 }] },
    ...(c.otherContracts ?? []).map((oc: any, i: number) => ({
      type: `其他合同${i + 1}`, contractNo: oc.contractNo, amount: oc.amount, partyA: oc.partyA, partyB: oc.partyB, settlementType: null as string | null,
      nodes: DETAIL_PAYMENT_NODES.map(n => ({ node: n, ratio: null as number | null }))
    }))
  ]
  return base
})

const sceneColumns = [
  { title: '序号',       key: 'index',       width: 60,  customRender: ({ index }: { index: number }) => index + 1 },
  { title: '应用场景',   dataIndex: 'type',  key: 'type',  width: 140 },
  { title: '应用场景块数', dataIndex: 'blocks', key: 'blocks', width: 120 },
  { title: '倾角',       dataIndex: 'tiltAngle', key: 'tiltAngle', width: 100, customRender: ({ text }: { text: number | null }) => text != null ? text + '°' : '—' },
  { title: '特殊方案',   dataIndex: 'specialPlan', key: 'specialPlan', width: 160, customRender: ({ text }: { text: string | null }) => text || '—' },
]
const jiagongReadonlyColumns = [
  { title: '序号',     key: 'index',    width: 50, customRender: ({ index }: { index: number }) => index + 1 },
  { title: '物料编码', dataIndex: 'code',     key: 'code',  width: 110 },
  { title: '物料名称', dataIndex: 'name',     key: 'name',  ellipsis: true },
  { title: '物料组',   dataIndex: 'group',    key: 'group', width: 80 },
  { title: '单位',     dataIndex: 'unit',     key: 'unit',  width: 56 },
  { title: 'BOM类型',  key: 'bomType', width: 80, customRender: () => '电器BOM' },
  { title: '确认数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
]
const yigongReadonlyColumns = [
  { title: '序号',     key: 'index',    width: 50, customRender: ({ index }: { index: number }) => index + 1 },
  { title: '类型',     dataIndex: 'type',  key: 'type',  width: 72 },
  { title: '物料编号', dataIndex: 'code',  key: 'code',  width: 110 },
  { title: '物料描述', dataIndex: 'name',  key: 'name',  ellipsis: true },
  { title: '单位',     dataIndex: 'unit',  key: 'unit',  width: 56 },
  { title: '确认数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
]

// ─── 操作 ─────────────────────────────────────────────────────────────────────

const handleEdit = () => {
  emit('edit', detail.value.id)
}

const handleVoid = async () => {
  try {
    await voidFiling(detail.value.id)
    message.success('已作废')
    emit('back')
  } catch {
    message.error('作废失败，请重试')
  }
}

async function voidFiling(_id: string) {}

// ─── 审核面板 ─────────────────────────────────────────────────────────────────

const reviewPanelVisible = ref(true)
const reviewCollapsed    = ref(true)
const showReviewFab   = computed(() => detail.value.filingStatus === 'reviewing_stock' && reviewPanelVisible.value &&  reviewCollapsed.value)
const showReviewPanel = computed(() => detail.value.filingStatus === 'reviewing_stock' && reviewPanelVisible.value && !reviewCollapsed.value)

watch(reviewCollapsed, async (collapsed) => {
  if (!collapsed) {
    await nextTick()
    if (reviewPanelEl.value) {
      const h = reviewPanelEl.value.getBoundingClientRect().height
      reviewPos.x = window.innerWidth - reviewSize.w - 32
      reviewPos.y = window.innerHeight - h - 32
    }
  }
})

const REJECT_REASONS = [
  '到货数量与计划不符',
  '到货单信息有误',
  '签收单缺失或不清晰',
  '物料型号不符',
  '收货人信息错误',
  '到货日期填写有误',
  '其他原因',
]
const reviewRejectReasons = ref<string[]>([])
const reviewComment       = ref('')
const reviewImageList     = ref<{ uid: string; name: string; url: string }[]>([])
const reviewDragOver      = ref(false)
const reviewPanelEl  = ref<HTMLElement | null>(null)
const reviewSize     = reactive({ w: 420, h: 0 })
const reviewPos      = reactive({ x: 0, y: 0 })
const reviewDragging = reactive({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 })
const cornerResizing = reactive({ active: false, corner: '' as 'nw'|'ne'|'sw'|'se'|'', startX: 0, startY: 0, startW: 0, startH: 0, startPX: 0, startPY: 0 })


function onReviewDragStart(e: MouseEvent) {
  reviewDragging.active = true
  reviewDragging.startX = e.clientX; reviewDragging.startY = e.clientY
  reviewDragging.originX = reviewPos.x; reviewDragging.originY = reviewPos.y
  window.addEventListener('mousemove', onReviewDragMove)
  window.addEventListener('mouseup', onReviewDragEnd)
}
function onReviewDragMove(e: MouseEvent) {
  if (!reviewDragging.active) return
  reviewPos.x = reviewDragging.originX + (e.clientX - reviewDragging.startX)
  reviewPos.y = reviewDragging.originY + (e.clientY - reviewDragging.startY)
}
function onReviewDragEnd() {
  reviewDragging.active = false
  window.removeEventListener('mousemove', onReviewDragMove)
  window.removeEventListener('mouseup', onReviewDragEnd)
}
function onCornerResizeStart(e: MouseEvent, corner: 'nw'|'ne'|'sw'|'se') {
  e.preventDefault(); e.stopPropagation()
  const currentH = reviewPanelEl.value?.getBoundingClientRect().height ?? 480
  if (reviewSize.h === 0) reviewSize.h = currentH
  cornerResizing.active = true; cornerResizing.corner = corner
  cornerResizing.startX = e.clientX; cornerResizing.startY = e.clientY
  cornerResizing.startW = reviewSize.w; cornerResizing.startH = reviewSize.h
  cornerResizing.startPX = reviewPos.x; cornerResizing.startPY = reviewPos.y
  window.addEventListener('mousemove', onCornerResizeMove)
  window.addEventListener('mouseup', onCornerResizeEnd)
}
function onCornerResizeMove(e: MouseEvent) {
  if (!cornerResizing.active) return
  const dx = e.clientX - cornerResizing.startX
  const dy = e.clientY - cornerResizing.startY
  const minW = 332, minH = 380
  const c = cornerResizing.corner
  const newW = Math.max(minW, cornerResizing.startW + (c === 'ne' || c === 'se' ? dx : -dx))
  const newH = Math.max(minH, cornerResizing.startH + (c === 'sw' || c === 'se' ? dy : -dy))
  reviewSize.w = newW
  reviewSize.h = newH
  if (c === 'nw' || c === 'sw') reviewPos.x = cornerResizing.startPX + (cornerResizing.startW - newW)
  if (c === 'nw' || c === 'ne') reviewPos.y = cornerResizing.startPY + (cornerResizing.startH - newH)
}
function onCornerResizeEnd() {
  cornerResizing.active = false
  window.removeEventListener('mousemove', onCornerResizeMove)
  window.removeEventListener('mouseup', onCornerResizeEnd)
}
function onReviewDropZoneDrop(e: DragEvent) {
  e.preventDefault(); reviewDragOver.value = false
  if (e.dataTransfer?.files) addReviewFiles(Array.from(e.dataTransfer.files))
}
function addReviewFiles(files: File[]) {
  files.filter(f => f.type.startsWith('image/')).forEach(f => {
    reviewImageList.value.push({ uid: Date.now() + '-' + f.name, name: f.name, url: URL.createObjectURL(f) })
  })
}
function removeReviewImage(uid: string) {
  reviewImageList.value = reviewImageList.value.filter(img => img.uid !== uid)
}
function onReviewClickUpload() {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = 'image/*'; input.multiple = true
  input.onchange = () => { if (input.files) addReviewFiles(Array.from(input.files)) }
  input.click()
}
function submitReview(action: 'pass' | 'reject' | 'skip') {
  if (action === 'pass')   message.success('已审核通过')
  else if (action === 'reject') message.warning('已标记审核不通过')
  else message.info('暂不审核')
  reviewPanelVisible.value = false
}
</script>

<style scoped>
/* ── 整体布局 ── */
.detail-page {
  height: calc(100vh - 81px); /* 减去 App 固定顶栏高度，detail-body.clientHeight 才与可见区一致 */
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* ── 固定顶栏 ── */
.detail-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 160px;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.detail-header-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; overflow: hidden; }
.detail-header-left :deep(.ant-tag) { flex-shrink: 0; margin-inline-end: 0; }
.back-btn { color: #595959; flex-shrink: 0; }
.detail-title { font-size: 16px; font-weight: 600; margin-left: 4px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 1; }
.detail-header-meta { display: flex; align-items: center; margin-left: 12px; gap: 0; flex-shrink: 0; }
.detail-header-meta-item { font-size: 13px; color: rgba(0,0,0,0.45); }
.detail-header-meta-divider { display: inline-block; width: 1px; height: 12px; background: rgba(0,0,0,0.15); margin: 0 8px; }

/* ── 内容区 ── */
.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  overscroll-behavior: contain;
}
.detail-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
.tabs-wrapper { background: #fff; border-radius: 8px; }
.detail-tabs :deep(.ant-tabs-nav) { position: sticky; top: 0; z-index: 9; background: #fff; border-radius: 8px 8px 0 0; }
/* 吸顶时 nav 撑满全宽（抵消 detail-body 两侧各 16px padding），卡片本体不变 */
.tabs-stuck .detail-tabs :deep(.ant-tabs-nav) { margin-left: -16px; margin-right: -16px; border-radius: 0; }
.detail-sidebar { width: 300px; flex-shrink: 0; align-self: flex-start; position: sticky; top: 72px; height: calc(100vh - 170px); }

/* ── 退回原因卡片 ── */
.reject-card {
  border: 1px solid rgba(220,38,38,.25);
  border-left: 4px solid #dc2626;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}
.reject-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px 0;
  font-size: 15px;
  font-weight: 600;
  color: #dc2626;
}
.reject-card-body { padding: 8px 16px 12px; }
.reject-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #595959;
  margin-bottom: 8px;
}
.reject-meta-item strong { color: #1a1a1a; }
.reject-reason { font-size: 13px; color: #1a1a1a; line-height: 1.6; }

/* ── 主内容卡片 ── */
.detail-card { border-radius: 8px; }
.detail-card--plain { background: #fff; padding: 20px; }
.detail-tabs :deep(.ant-tabs-content-holder) { padding: 0; }
.tab-body { padding: 20px; background: #fff; border-radius: 0 0 8px 8px; }

/* ── 信息分区 ── */
.info-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f5f5f5;
}
.info-section:first-child,
.section-title + .info-section { margin-top: 0; padding-top: 0; border-top: none; }
.tab-body--design .info-section { border-top: none; padding-top: 0; margin-top: 32px; }
.tab-body--commercial .info-section { border-top: none; padding-top: 0; margin-top: 32px; }

.section-title--toggle { cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; }
.section-title--collapsed { margin-bottom: 0 !important; }
.section-toggle-icon { font-size: 12px; color: #8c8c8c; background: #f0f0f0; padding: 7px 6px 5px; border-radius: 4px; display: inline-flex; align-items: center; transition: transform 0.2s; }
.section-toggle-icon.rotated { transform: rotate(-90deg); }
.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #000;
  margin-bottom: 24px;
}
.info-section-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  margin: 20px 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.info-section-title :deep(.ant-btn) { height: 28px; }
.info-section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 16px;
  background: #1677ff;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── 信息栅格（Figma 规范：4列，gap 20px，label上/value下） ── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.info-item {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.info-item--span2 { grid-column: span 2; }
.info-item--span3 { grid-column: span 3; }
.section-sub-title { font-size: 16px; font-weight: 500; color: rgba(0,0,0,0.88); margin: 20px 0; display: flex; align-items: center; gap: 8px; }
.section-sub-title::before { content: ''; width: 3px; height: 16px; background: #1677ff; border-radius: 2px; flex-shrink: 0; }
.upload-hint-icon { font-size: 13px; color: #8c8c8c; cursor: pointer; flex-shrink: 0; margin-left: 4px; }
.section-header { display: flex; align-items: center; justify-content: space-between; }
.section-header :deep(.ant-btn) { height: 28px; }
.info-item--span4 { grid-column: span 4; }
.info-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 22px;
  padding-bottom: 8px;
  white-space: nowrap;
}
.info-value {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 22px;
  word-break: break-word;
}

.contract-block-ro {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
}
.contract-block-ro-header {
  background: #fafafa;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0,0,0,0.85);
  border-bottom: 1px solid #f0f0f0;
}
.contract-block-ro .info-grid { padding: 16px; }
.section-sub { font-size: 12px; color: #8c8c8c; }



/* ── 勘察照片只读 ── */
.photo-readonly-col   { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.photo-readonly-label { font-size: 14px; color: rgba(0,0,0,0.45); }
.photo-readonly-imgs  { display: flex; flex-wrap: wrap; gap: 8px; }
.empty-hint { font-size: 13px; color: #bbb; padding-top: 4px; }


/* ── 身份证预览 ── */
.id-card-img { width: 150px; height: 100px; border-radius: 7px; }
.id-card-img--front { background: #DDE8F4; }
.id-card-img--back  { background: #D6E3EF; }

/* ── 付款节点 ── */
.payment-nodes { display: flex; gap: 10px; margin-bottom: 20px; }
.payment-node-row {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 16px; background: #fafafa;
  border: 1px solid #f0f0f0; border-radius: 6px;
  flex: 1; text-align: center;
}
.payment-node-label { font-size: 13px; font-weight: 500; }
.payment-node-pct { font-size: 15px; font-weight: 600; color: #1677ff; }
.payment-node-desc { font-size: 12px; color: #8c8c8c; line-height: 1.4; }

/* ── 流转日志 ── */
.log-card { background: #fff; border-radius: 8px; height: 100%; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden; }
.log-card-header { padding: 20px 20px 12px; flex-shrink: 0; border-bottom: 1px solid #f0f0f0; }
.log-card-header .section-title { margin-bottom: 0; }
.log-card-body { flex: 1; overflow-y: auto; padding: 16px 20px 20px; box-sizing: border-box; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
.log-card-body::-webkit-scrollbar { width: 4px; }
.log-card-body::-webkit-scrollbar-track { background: transparent; }
.log-card-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }

.approval-list       { display: flex; flex-direction: column; gap: 16px; }
.approval-date-group { display: flex; flex-direction: column; gap: 8px; }
.approval-date-header { display: flex; align-items: center; gap: 8px; padding: 0 4px; }
.approval-date-icon   { font-size: 14px; color: rgba(0,0,0,.45); }
.approval-date-text   { font-size: 14px; font-weight: 500; color: rgba(0,0,0,.88); }

.approval-items { display: flex; flex-direction: column; padding-left: 4px; }
.approval-item  { display: flex; gap: 12px; align-items: flex-start; }

.approval-connector { display: flex; flex-direction: column; align-items: center; gap: 4px; align-self: stretch; flex-shrink: 0; }
.connector-line         { width: 1px; background: #e6e6eb; flex-shrink: 0; }
.connector-line--top    { height: 8px; }
.connector-line--bottom { flex: 1 0 0; min-height: 1px; }
.connector-icon         { font-size: 15px; flex-shrink: 0; }
.connector-icon--create  { color: #8c8c8c; }
.connector-icon--submit  { color: #1677ff; }
.connector-icon--reject  { color: #f5222d; }
.connector-icon--approve { color: #52c41a; }
.connector-icon--void    { color: #8c8c8c; }

.approval-card-wrap { flex: 1; padding-bottom: 12px; }
.approval-card {
  background: #fff;
  border: 1px solid #e6e6eb;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.approval-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.approval-card-title  { font-size: 14px; font-weight: 500; color: #1f1f1f; }
.approval-tag {
  font-size: 12px; font-weight: 400;
  padding: 0 8px; height: 22px; line-height: 20px;
  border-radius: 4px; border: 1px solid;
  white-space: nowrap; flex-shrink: 0;
}
.approval-tag--create  { background: rgba(0,0,0,.02); border-color: #d9d9d9; color: rgba(0,0,0,.45); }
.approval-tag--submit  { background: #e8f7ff; border-color: #8bceff; color: #007bfe; }
.approval-tag--reject  { background: #ffe9e7; border-color: #ffaca7; color: #f5222d; }
.approval-tag--approve { background: #e8fbd6; border-color: #b7eb8f; color: #52c41a; }
.approval-tag--void    { background: rgba(0,0,0,.02); border-color: #d9d9d9; color: rgba(0,0,0,.45); }

.approval-card-body { display: flex; flex-direction: column; gap: 4px; }
.approval-field     { display: flex; gap: 4px; align-items: baseline; font-size: 13px; line-height: 20px; }
.field-label        { color: #8c8c8c; flex-shrink: 0; }
.field-value        { color: #1f1f1f; }
.field-value--muted { color: rgba(0,0,0,.45); }
.field-value--red   { color: #f5222d; }

/* ── 审核面板 ── */
.review-fab {
  position: fixed; right: 24px; bottom: 24px; z-index: 1001;
  height: 40px; padding: 0 16px; border-radius: 20px;
  background: #007BFE; color: #fff;
  display: flex; flex-direction: row; align-items: center; gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,123,254,0.35);
  transition: box-shadow .15s, transform .15s;
}
.review-fab:hover { box-shadow: 0 6px 20px rgba(0,123,254,0.45); transform: translateY(-1px); }
.review-panel {
  position: fixed; z-index: 1000; width: 420px;
  background: #fff; border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
  display: flex; flex-direction: column; overflow: hidden; user-select: none;
}
.review-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 20px 0; cursor: grab; background: #fff;
}
.review-panel-header:active { cursor: grabbing; }
.review-panel-title { font-size: 15px; font-weight: 600; color: rgba(0,0,0,0.88); }
.review-panel-drag-icon { font-size: 16px; color: #9ca3af; cursor: grab; transform: rotate(90deg) translateX(2px); }
.review-panel-drag-icon:hover { color: #6b7280; }
.review-panel-close { font-size: 20px; color: #9ca3af; cursor: pointer; line-height: 1; padding: 0 2px; }
.review-panel-close:hover { color: #374151; }
.review-textarea-wrap {
  display: flex; flex-direction: column;
  margin: 0 20px 0; border: 1px solid #d9d9d9; border-bottom: none;
  border-radius: 8px 8px 0 0; overflow: hidden; transition: border-color .15s;
}
.review-drop-zone {
  margin: 0 20px; border: 1px solid #d9d9d9; border-top: none;
  border-radius: 0 0 8px 8px; overflow: hidden; transition: border-color .15s, box-shadow .15s;
}
.review-drop-zone::before {
  content: ''; display: block; height: 1px; background: #f0f0f0; margin: 0 12px;
}
.review-textarea-wrap.drag-over,
.review-drop-zone.drag-over {
  border-color: #3060FF; box-shadow: 0 0 0 2px rgba(48,96,255,0.12);
}
.review-drop-hint { padding: 20px; font-size: 14px; color: #a7a5b0; cursor: pointer; }
.review-image-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 20px; }
.review-image-item { position: relative; display: inline-block; }
.review-image-item img { width: 72px; height: 72px; object-fit: cover; border-radius: 4px; border: 1px solid #f0f0f0; display: block; }
.review-image-delete { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.55); color: #fff; font-size: 13px; line-height: 18px; text-align: center; cursor: pointer; display: none; }
.review-image-item:hover .review-image-delete { display: block; }
.review-panel-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 20px; }
.review-reject-reasons { padding: 20px 20px 12px; }
.review-reject-label { font-size: 14px; color: rgba(0,0,0,0.65); margin-bottom: 6px; }
.review-corner-handle {
  position: absolute; width: 16px; height: 16px; z-index: 20;
}
.review-corner-handle--nw { top: 0; left: 0; cursor: nwse-resize; }
.review-corner-handle--ne { top: 0; right: 0; cursor: nesw-resize; }
.review-corner-handle--sw { bottom: 0; left: 0; cursor: nesw-resize; }
.review-corner-handle--se { bottom: 0; right: 0; cursor: nwse-resize; }

/* ── 合同付款比例（非标详情）── */
.payment-contract-card { border: 1px solid #e8e8e8; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
.payment-contract-header { padding: 12px 16px; background: #fafafa; border-bottom: 1px solid #e8e8e8; }
.payment-contract-type { font-size: 14px; font-weight: 600; color: #262626; margin-bottom: 10px; }
.payment-contract-meta-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 24px; }
.payment-meta-item { display: flex; align-items: center; gap: 4px; font-size: 13px; }
.payment-meta-label { color: #8c8c8c; }
.payment-meta-value { color: #262626; }
.payment-ratio-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.payment-ratio-table th { padding: 10px 12px; text-align: left; background: #f5f5f5; color: #595959; font-weight: 500; border-bottom: 1px solid #e8e8e8; }
.payment-ratio-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; position: relative; top: -0.5px; }
.payment-ratio-table tbody tr:last-child td { border-bottom: none; }
:deep(.stat-row-done td) { background: #f6ffed !important; color: #389e0d; }
:deep(.stat-drawer-body .ant-table-tbody > tr > td) { padding-top: 13px !important; padding-bottom: 13px !important; }
.payment-row-label { color: #8c8c8c; font-size: 13px; white-space: nowrap; }
.payment-amount-cell { color: #262626; font-variant-numeric: tabular-nums; }
.payment-total-cell { font-weight: 600; color: #262626; }
.copy-icon {
  margin-left: 5px;
  font-size: 12px;
  color: rgba(0,0,0,0.35);
  cursor: pointer;
  vertical-align: middle; position: relative; top: -0.5px;
}
.copy-icon:hover { color: #1677ff; }

/* Drawer 只读显示值 */
.drawer-readonly-val { font-size: 14px; color: rgba(0,0,0,0.88); line-height: 32px; }

/* 附件上传 Modal */
.attach-modal-body { display: flex; flex-direction: column; gap: 20px; padding-top: 8px; }
.attach-group { display: flex; flex-direction: column; gap: 8px; }
.attach-group-label { font-size: 14px; color: rgba(0,0,0,0.88); display: flex; align-items: center; gap: 2px; }
.attach-req { color: #ff4d4f; }
</style>
