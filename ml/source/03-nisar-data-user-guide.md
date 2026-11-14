# NISAR Data User Guide

- **Source URL:** https://nisar-docs.asf.alaska.edu/
- **GitHub docs:** https://github.com/ua-asf/nisar-docs
- **Citation DOI:** https://doi.org/10.5281/ZENODO.20075813
- **Priority for OrangHave / H.O.M.E.:** Utama
- **Relevance:** Inti tema Space Apps “Dancing with the SARs”; produk L-band, akses Vertex/Earthdata, GCOV untuk ekosistem/disturbance, storytelling smoke-piercing radar.

## Landing

# NISAR Data User Guide
The joint NASA/ISRO Synthetic Aperture Radar ( NISAR ) platform supports an enhanced understanding of changes occurring on Earth through time. Data from the NISAR mission can be used to monitor ecosystems, ice masses, vegetation biomass, sea level, groundwater dynamics, geophysical processes, and natural hazards.
NISAR ’s dual-band radar systematically images the Earth’s surface, regardless of light or cloud conditions, and can measure surface deformation on the centimeter scale.
All NISAR science data is freely available and open to the public, consistent with the long-standing NASA Earth Science open data policy.
This guide aims to help those who research and monitor the Earth find all the information they need to know about accessing and working with NISAR data in one place.
NISAR Satellite in Earth Orbit (Artist’s Concept). Credit: NASA/JPL-Caltech
## Citation ¶
To cite content from this user guide, use the reference below or refer to Kristenson et al. (2026) for more citation formats.
References ¶
- Kristenson, H., Smale, J., Johnston, A., Herrmann, J., Gens, R., Kennedy, J. H., White, J., Lewandowski, A., Larsen, L., Horn, W., Rosen, P., Lavalle, M., & Fattahi, H. (2026). NISAR Data User Guide . Zenodo. 10.5281/ZENODO.20075813 NISAR Data User Guide About NISAR
Questions? Visit the Earthdata Forum or email ASF User Services at uso@asf.alaska.edu
## About NISAR

# About NISAR
## The NISAR Mission ¶
NISAR is a joint Earth-observing mission between the National Aeronautics and Space Administration (NASA) and the Indian Space Research Organization (ISRO) , with the goal to make global measurements of the causes and consequences of land surface changes using advanced radar imaging. Access to NISAR mission data is free and open.
The NISAR platform collects data using both L-band and S-band SAR sensors. NASA hosts the data acquired by the L-band sensor, and ISRO hosts the data collected by the S-band sensor.
L-band data is collected globally, providing acquisitions over most landmasses and sea ice on a regular repeat cycle.
S-band data is collected over select areas, as described in the mission observation plan .
### NISAR Mission Concept ¶
The mission concept and the resulting partnership were in response to the National Academy of Science’s 2007 Decadal Survey National Research Council, 2007 of Earth observational priorities for the next decade.
One of the top priorities identified in this survey was to gain data and insight in three Earth science domains:
Ecosystems
Deformation of Earth’s Crust
Cryospheric Sciences
Refer to NASA’s NISAR Mission website for more information.
### NISAR Science Objectives ¶
The NISAR Mission Science Users’ Handbook NISAR, 2025 defines the key scientific objectives as follows:
NISAR addresses the needs of Solid Earth, Ecosystems, Cryospheric, and Soil Moisture science disciplines, with a specific focus on the following key scientific objectives to:
Determine the likelihood of earthquakes, volcanic eruptions, landslides, and land subsidence
Understand the dynamics of carbon storage and uptake in wooded, agricultural, wetland, and permafrost systems
Understand the response of ice sheets to variations in the climate, the interaction of sea ice and climate, and impacts on sea level rise worldwide
Constrain global patterns of soil moisture and their temporal variability, across a wide range of land cover types and climate regimes
### NISAR Mission Science Users’ Handbook ¶
The NASA-ISRO SAR (NISAR) Mission Science Users’ Handbook NISAR, 2025 provides a wealth of information about all aspects of the mission. It describes the mission goals, requirements, characteristics and instrumentation. It also provides an overview of the mission data products and the range of scientific applications supported by the mission.
Published by JPL , this valuable resource is a PDF publication available online. It is a large document that can either be viewed directly in a browser or downloaded for offline use.
Note that all references to the NISAR Mission Science Users’ Handbook on this site link to the second edition, which was published in 2025. This edition supersedes the previous edition, published in 2019, and we advise users to reference this second edition instead of the older publication.
### Jet Propulsion Laboratory ¶
The Jet Propulsion Laboratory (JPL) is located on the outskirts of Pasadena, California. Founded in 1936 by California Institute of Technology (Caltech) researchers, JPL is a research and development lab federally funded by NASA and managed by Caltech.
JPL leads the U.S. portion of the NISAR project on behalf of NASA, including project management, providing physical components of the satellite, testing, coordinating science product development, developing and processing data products, and publishing product specifications and algorithm theoretical basis documents.
JPL generates a suite of products from NISAR mission data, ranging from Level 0 to Level 3, which ASF makes available to the public. Refer to the data products section of this site for more information on NISAR data products.
### Alaska Satellite Facility ¶
The Alaska Satellite Facility (ASF) Distributed Active Archive Center ( DAAC ) has been selected to archive the data from the NISAR mission. ASF maintains the NASA archive of Synthetic Aperture Radar ( SAR ) data from various satellites and aircraft, providing these data and associated services to the public in support of NASA’s Earth Science Data and Information System ( ESDIS ) project.
ASF utilizes NASA’s Earthdata Cloud for processing, storage and distribution of the data. This environment leverages Amazon Web Service ( AWS ) infrastructure, allowing datasets to be accessed directly and efficiently in cloud computing workflows.
## NISAR Instrumentation ¶
### Sweep SAR ¶
NISAR was designed to deliver global coverage at full resolution and with polarimetric diversity. The technical innovation that allows this performance is the scan-on-receive SweepSAR design , conceived and refined collaboratively by NASA and the German Space Agency (DLR).
Figure 1 : Sweep SAR technique, which allows full-resolution, multipolarimetric observations across an extended swath (> 240 km). By transmitting energy across the full feed aperture, a wide swath is illuminated on the ground. Each patch element on the feed can receive independently, allowing localization in time, hence space, of the return echo scattered from the ground. Note: Transmit and scanning receive events overlap in time and space. Alongtrack offset shown is for clarity of presentation only . Credit: NISAR Mission Handbook 2025
A more detailed description of the NISAR instrument design is in section 4.7 of the NISAR Mission Handbook NISAR, 2025 .
#### Pulse Repetition Frequency ¶
Sweep SAR is able to generate gapless imagery by varying the Pulse Repetition Frequency ( PRF ). Because the radar cannot receive echoes while it is transmitting, there are gaps in the imagery when the PRF is fixed. By varying the PRF , or dithering , NISAR moves the gaps around as data is acquired, allowing for interpolation across the gaps.
Most of NISAR ’s acquisition modes make use of variable PRF s, generating gapless imagery. There are, however, some fixed PRF modes. In the current acquisition plan, fixed PRF s are only used for quad-pol acquisitions .
Quad-pol acquisitions ¶
All NISAR quad-pol observations currently use a fixed PRF because of the operational constraints of quad-pol acquisitions. Using variable PRF s degrades image quality, so the tradeoff for high image quality is the presence of bands of data gaps in the imagery, as seen in Figure 2 .
Figure 2 : The data gaps caused by the fixed PRF used for quad-pol acquisitions are visible as black bands in this Frequency A HHHH covariance dataset from the quad-pol NISAR _L2 _ PR _ GCOV _026 _055 _D _068 _2005 _QPDH _A _20260724T003402 _20260724T003437 _P05023 _N _F _J _001.h5 product.
These gaps are moved from cycle to cycle to allow complete coverage over time, but any individual image will have some data missing. This is a permanent and expected feature of standard NISAR quad-pol acquisitions.
The NISAR mission is experimenting with variable PRF acquisitions, and products generated using this approach may be made available in the future, but this experimental mode is still being evaluated.
### Look Direction ¶
SAR sensors are always side looking , with data being collected at an angle from the nadir ( Figure 3 ).
Figure 3 : The observing geometry of the NISAR platform, showing the area imaged by the 240 km NISAR swath relative to the nadir. Diagram modified from the Harnessing NISAR: Next-Generation Radar Observations for Earth Applications course from the NASA Applied Remote Sensing Training Program (AR SET ), 2026.
NISAR is a left-looking mission, which allows for complete coverage over Antarctica. The tradeoff is an area around the North Pole where coverage is not available ( Figure 4 ).
Figure 4 : Area around the North Pole where NISAR aquisitions are not available, as visualized in the NISAR Reference Observation Plan app .
### Bands ¶
The NISAR mission collects data using two different SAR sensors, each acquiring data in a different band , or range of wavelengths.
#### L-Band ¶
The L-band Synthetic Aperture Radar (L- SAR ) instrument is the focus of the NASA-chartered science goals for NISAR , and provides global coverage. The L- SAR instrument operates at a wavelength of 24 cm.
Most L-band acquisitions have a swath width of about 240 km, an along-track resolution of 7 m, and a cross-track resolution of 2 to 8 m (depending on mode).
#### S-Band ¶
The S-band SAR (S- SAR ) instrument, developed in a collaboration between NASA and the Indian Space Research Organization (ISRO), operates at a wavelength of 9.3 cm and is primarily used for acquisitions over India.
### Frequencies ¶
NISAR is equipped to acquire data in two slightly different frequencies at each bandwidth. Table 1 summarizes the Frequency A and the Frequency B settings that define the acquisition modes.
Frequency A is the primary frequency used for generating scientific products, while Frequency B data is collected primarily for use in atmospheric corrections. Many NISAR products include datasets for both Frequency A and Frequency B data, and some users may find the Frequency B data useful in its own right.
Frequency B datasets are generally posted at a coarser pixel spacing than Frequency A datasets, so analysis workflows requiring higher resolution are better served by the Frequency A data. The larger pixels of Frequency B datasets result in them being much smaller files, which take less time to download and render, making them useful for regional analysis workflows or a quick look at the data.
Table 1 : Center frequencies (MHz) for NISAR acquisition bandwidths
L-band bandwidth [MHz] Center frequency [MHz]
Frequency A Frequency B
77 1257.5 NA
40+5 1239 1293.5
20+5 1229 1293.5
20+20 1229 1286
5+5 1221.5 1236.5
### Polarization ¶
The polarization refers to the direction that an electromagnetic wave travels. This can be horizontal, vertical, or circular. Circular polarizations, where the wave is rotating in a constant plane to the left or right, are much less commonly used for SAR sensors than linear (horizontal or vertical) polarizations.
The antennas of a SAR system can be configured to transmit and receive electromagnetic waves using various combinations of these polarizations. The polarimetric properties of the observed surface can reveal the structure, orientation and environmental conditions of the surface elements.
Signals that are transmitted and received in the same polarization are called co-polarized (co-pol). Signals that are received in a different polarization from the transmitted polarization are called cross-polarized (cross-pol).
#### NISAR Polarimetric Channels ¶
For the NISAR mission, the polarimetric channels available in a product will vary based on the acquisition mode. The 2-digit polarization code, indicating the transmit polarization followed by the receive polarization, is indicated as part of each dataset name.
Each product filename indicates the polarimetric channels available for the datasets contained in that product. Refer to NISAR Naming Conventions to see where the polarization is indicated in the filename for different product types.
The potential polarization configurations for NISAR products are as follows:
Single polarization (single-pol) ¶
SH: HH single-pol data
SV: VV single-pol data
Dual polarization (dual-pol) ¶
DH: HH+HV dual-pol data
DV: VV+VH dual-pol data
Quad polarization (quad-pol) ¶
QP: HH+HV+VH+VV quad-pol data
Compact polarization (circular) ¶
RH: right-circular HH data
RV: right-circular VV data
References ¶
- National Research Council. (2007). Earth Science and Applications from Space: National Imperatives for the Next Decade and Beyond . The National Academies Press. 10.17226/11820
- NISAR. (2025). NASA-ISRO SAR (NISAR) Mission Science Users’ Handbook, Second Edition (Second Edition). NASA Jet Propulsion Laboratory. 10.48577/jpl.UD4HV3 NISAR Data User Guide NISAR Data User Guide NISAR Data User Guide Available Data
Questions? Visit the Earthdata Forum or email ASF User Services at uso@asf.alaska.edu
## Available Data

# Available NISAR Data
NISAR launched July 30, 2025, and has been successfully collecting data through its Commissioning phase and into the Science phase. The calibration-validation process is complete, and fully calibrated and validated NISAR L-band products are now available to the public.
In addition, NISAR S-band products can be accessed through ISRO’s Bhoonidhi data hub . Refer to the Bhoonidhi NISAR Mission site for more information.
## NISAR VALIDATED Data: November 2026 ¶
Find NISAR VALIDATED L-Band Data
NISAR VALIDATED datasets were released November 6, 2026. These products are fully calibrated and validated, and collections are available for all mission products from Level 0 through Level 2. VALIDATED collections include products for all L-band NISAR acquisitions starting October 21, 2026.
While the maturity levels for PROVISIONAL and BETA products are included in the collection names, VALIDATED collections are distinguished by not indicating a maturity level.
VALIDATED Level 3 Soil Moisture (SME2) products are not yet available, as additional validation efforts using the PROVISIONAL and VALIDATED GCOV datasets are still underway.
### Known Issues ¶
Most of the known issues identified in the BETA and PROVISIONAL products have been resolved, but there are still some known issues in the VALIDATED data products.
### NISAR Composite Release ID (CRID) ¶
The initial release of VALIDATED data uses NISAR Composite Release ID (CRID) version P05036. Additional updates to the processing software are anticipated before the reprocessing campaign begins. Even once the reprocessing campaign is complete, updates to the processing software can be expected periodically as algorithms are further refined, resulting in products that are generated using different CRID versions.
CRID version updates, including descriptions of the changes introduced with each version, are tracked on the NISAR CRID page for reference.
## NISAR PROVISIONAL Data: July 2026 ¶
Find NISAR PROVISIONAL L-Band Data
NISAR PROVISIONAL datasets were released July 20, 2026. These products are fully calibrated and have undergone validation at a limited set of sites around the world. These datasets are designated as PROVISIONAL pending more complete validation over larger areas around the globe, but are a significant improvement over the BETA products released in February 2026.
NISAR PROVISIONAL collections are available for all mission products from Level 0 to Level 3, including raw Level-0B RRSD products. Prior data releases did not include RRSD products.
Most of the known issues with the BETA products have been resolved in this release, and the PROVISIONAL products generally meet radiometric and geolocation requirements in lower-latitude areas where ionospheric variability is low, but there are still a few known issues users should be aware of when working with the PROVISIONAL products.
NISAR Data Gap
Permanent NISAR instrument data gap exists between 2026-07-27T22:03:25Z and 2026-08-10T00:55:27Z .
The PROVISIONAL products are generated using the NISAR Composite Release ID (CRID) P05023 , and are available for all acquisitions starting June 17, 2026. Users should take care if they choose to combine PROVISIONAL products with BETA products (generated at lower CRID numbers than 05023) in analysis workflows, as some differences will be due to changes in the processing software.
### Supplemental Provisional Products ¶
The PROVISIONAL collections also include longer time series for specific frames that were selected by the science team for use in time-series validation work.
## NISAR BETA Data: February 2026 ¶
Find NISAR BETA L-Band Data
Prior to the release of the PROVISIONAL products, a selection of pre-calibration BETA NISAR L-band products was made available through the ASF DAAC . These BETA products were released to allow users to develop workflows to access the data and metadata for each product type, to become familiar with the characteristics of the L-band products, and to begin working with the data in a substantive way.
The BETA products are not fully calibrated, and there are a number of known issues users should be aware of when working with these datasets. The PROVISIONAL products released in July 2026 are fully calibrated and partially validated, and are a significant improvement over the BETA products. Users should exercise care if attempting to analyze BETA products together with PROVISIONAL products.
The February 2026 release includes all Level-1 to Level-3 products for a subset of the data acquired between October 17, 2025 and January 20, 2026. This includes up to 8 acquisitions per track (both ascending and descending), and is a representative distribution of the production observation plan. Figure 1 displays the spatial extent of the data included in this release. For a more detailed acquisition map, see the interactive NISAR February 2026 Released Data map.
Figure 1 : Spatial distribution of the archived pre-calibration NISAR data products, highlighted in green, included in the February 2026 data release.
Basemap credits: Esri, TomTom, Garmin, FAO, NOAA, USGS, (c) OpenStreetMap contributors, and the GIS User Community.
## L-Band Data Release Timeline ¶
NISAR has continually collected L-band data over nearly all global landmasses since August 2025. Figure 2 shows the spatial extent of the collected data. The NISAR Reference Observation Plan provides a more detailed, interactive map of NISAR data acquisitions.
Figure 2 : Spatial extent of NISAR L-band data collection, highlighted in green. Basemap credits: Esri, TomTom, Garmin, FAO, NOAA, USGS, (c) OpenStreetMap contributors, and the GIS User Community.
All L-band data products processed by the mission will be available to the public through the Alaska Satellite Facility.
The nominal data release timeline as of November 2026 is described below.
### Jan 2026: Sample products ¶
An initial release of 25 pre-calibration sample data products took place on January 23, 2026. This release included one or more products of each of the nine Level 1-3 product types.
### Feb 2026: Pre-calibration products ¶
A larger volume of pre-calibration global data products became available on February 27, 2026. This release included over 100,000 Level 1-3 products totaling over 500 TB of science data. These datasets are marked as BETA , as they are not yet fully calibrated.
### Jul 2026: Provisional products ¶
Global L-band NISAR Provisional products were released on July 20, 2026. These datasets are marked as PROVISIONAL , indicating that they are calibrated and partially validated, but processing improvements are still underway. Provisional datasets are available for all acquisitions starting from June 17, 2026 until partway through October 23, 2026.
This release was the first to include L0B RRSD products along with Level 1-3 products. PROVISIONAL products were continuously generated as data was acquired, and made publicly available for all areas shown in Figure 2 and in the NISAR Reference Observation Plan . Note that the Level 3 Soil Moisture (SME2) products in the PROVISIONAL collection are not considered fully calibrated .
### Nov 2026: Validated products (L0-2) ¶
Validated NISAR Level 0-2 products were released on November 6, 2026. This release includes products from all L-band NISAR acquisitions starting October 21, 2026.
### 2027: Validated reprocessing ¶
Once forward processing of validated products is underway and any algorithm updates have been integrated into the processing software, the NISAR project will transition to a reprocessing campaign for data acquired before October 21, 2026. These validated products will supersede any earlier versions of the data in the archive.
This reprocessing campaign will generate new versions of Level 0-2 products from the global backlog of all L-band data collected during the science phase of the mission. Data products will be continually published to ASF and made publicly available as they are generated during the reprocessing effort.
### 2027: Validated SME2 products ¶
Once there are sufficiently long time series of validated GCOV products available to validate and refine the Level 3 Soil Moisture (SME2) products, there will be a VALIDATED SME2 collection added to the archive. Until that time, SME2 products will continue to be added to the PROVISIONAL SME2 collection.
NISAR Data User Guide About NISAR NISAR Data User Guide Known Issues
Questions? Visit the Earthdata Forum or email ASF User Services at uso@asf.alaska.edu
## Data Products

# NISAR Data Products
## Data Products Overview ¶
There are a range of data products generated by the NISAR mission team that are archived and available for immediate use, from raw data to analysis-ready products.
One of the most exciting aspects of the NISAR mission is that it generates a number of analysis-ready SAR datasets. These Level 2 (Geocoded) and Level 3 (Geophysical) products are archived and freely available to the public. This allows users without the software or expertise necessary to process SAR data easy access to products that can be used in analysis workflows.
For SAR scientists and those who want to generate products to their own specifications, the Level 0 (Raw) data and Level 1 (Range-Doppler) products are also available.
NISAR Data Product Availability
Fully calibrated and validated NISAR data products are now available for Level 0-2 product types! These products are available for all L-band acquisitions starting October 21, 2026, and they represent a significant improvement over the PROVISIONAL data products.
Learn more about VALIDATED data and the expected timeline for the validated reprocessing campaign .
Note that VALIDATED data is not yet available for Level 3 Soil Moisture (SME2) product .
### NISAR Maturity Levels ¶
NASA uses different data maturity levels for data generated over the duration of a mission. There are currently NISAR datasets available for three different maturity levels:
The BETA collections include products from the first two releases of NISAR data in January 2026 and February 2026 . These products are not fully calibrated, and exhibit a number of known issues , but are still useful for those who would like to access products from earlier in the mission.
The PROVISIONAL collections include products from the July 2026 release. These products are fully calibrated and partially validated, and were used for additional validation efforts.
These provisional products are available for all L-band acquisitions from June 17, 2026, through part of October 23, 2026.
VALIDATED collections were released November 6, 2026 for Level 0-2 products, and include products for all NISAR L-band acquisitions starting from October 21, 2026. These products are fully calibrated and validated.
Unlike the PROVISIONAL and BETA datasets, the VALIDATED collections do not include the data maturity in the collection name. For example, the PROVISIONAL GCOV collection is NISAR_L2_GCOV_PROVISIONAL_V1 , while the VALIDATED collection is simply NISAR_L2_GCOV_V1 .
The BETA products do not generally overlap temporally with the PROVISIONAL products, and, until the reprocessing campaign is complete, BETA and PROVISIONAL data do not overlap temporally with VALIDATED data. Users who want to access the data from earlier in the mission may still find the BETA and/or PROVISIONAL products useful.
Because of updates to the processing software to improve product quality, use caution when including multiple data maturities in the same analysis workflow. Differences between products from the different maturities may be due to differences in the processing workflow rather than actual changes on the landscape.
## NISAR Product Levels ¶
The NASA processing levels used for SAR have somewhat different meanings than those used for multi-spectral (optical) imagery. We will summarize these processing levels and the specific products generated by the mission at each level and provide links to additional information about each product type.
Figure 1 illustrates the products that will be generated in association with the NISAR mission, indicating the products used as input. Level 0 through Level 2 products will be produced directly by the mission and archived at ASF , as will the Level 3 Soil Moisture products.
Figure 1 : NISAR Data Product Levels based on product specification documentation
Additional Level 3 and 4 products will be produced by the NISAR science team, but only for specific areas used for calibration and validation activities. Some of these cal/val products may be archived and available to the public. The algorithms for these higher-level products are available as Python notebooks , allowing users to generate these scientific products themselves for other locations.
### Level 0: Unfocused Raw Products ¶
Level 0 products are unprocessed instrument data. L0A products are the received raw data, which are archived for reference but are not of use to the scientific community. L0B products have been processed to remove transmission artifacts, and are the starting point for processing all additional mission products. They are generally only of interest to SAR scientists.
The Radar Raw Signal Data (RRSD) L0B product contains corrected, aligned radar pulse data.
### Level 1: Range-Doppler Products ¶
Level 1 products are processed instrument data, focused to full resolution complex images. They are time referenced and annotated with ancillary information, including radiometric and relevant geometric calibration coefficients and georeferencing parameters (i.e. platform ephemeris). Level 1 products are in natural radar coordinates, and cannot be directly overlaid on a map.
The Range-Doppler Single Look Complex (RSLC) product contains focused SAR images in range-Doppler coordinates. Other pair-based Level 1 products are derived from this product.
The Range-Doppler Interferogram (RIFG) product represents the ellipsoid height-corrected, wrapped interferogram generated from two RSLC s in range-Doppler coordinates. The RIFG product is primarily meant for detecting grounding lines.
The Range-Doppler Pixel Offsets (ROFF) product represents a collection of dense pixel offsets layers obtained from applying speckle tracking to a pair of coarsely coregistered RSLC s in range-Doppler coordinates. The ROFF product is primarily meant for cryosphere applications.
The Range-Doppler Unwrapped Interferogram (RUNW) product represents the unwrapped, multi-looked differential interferogram generated from two RSLC s in range-Doppler coordinates. The RUNW product primarily supports the solid earth requirement of ground surface displacement measurements.
### Level 2: Geocoded Products ¶
Level 2 products are derived from Level 1 products, resampled and geocoded to a geographic grid. The geographic location of the Level 2 product determines which projection is used, as described in NISAR Level 2 Projections . Datasets from Level 2 products can be directly overlaid on a map and align with other geospatial data.
The Geocoded Single Look Complex (GSLC) product represents the single look complex signal return for each polarization in geographic coordinates. The GSLC product enables users to perform backscatter amplitude analysis, and can be combined with other similar GSLC products to derive interferograms and change maps.
The Geocoded Pixel Offsets (GOFF) product represents a collection of dense pixel offsets layers obtained from applying speckle tracking to a pair of coarsely coregistered RSLC s in geographic coordinates. The GOFF product is primarily meant for cryosphere applications.
The Geocoded Polarimetric Covariance Matrix (GCOV) product provides radiometrically terrain corrected SAR backscatter data to primarily support the NISAR ecosystem requirements of biomass estimation, soil moisture estimation, disturbance detection, inundation mapping, and crop area delineation.
The Geocoded Unwrapped Interferogram (GUNW) product represents the unwrapped, multi-looked differential interferogram generated from two RSLC s in geographic coordinates. The GUNW product primarily supports the solid earth requirement of ground surface displacement measurements.
### Level 3: Geophysical Products ¶
Level 3 products represent geophysical parameters derived from radar-specific parameters and projected to the EASE-Grid 2.0 .
The Soil Moisture (SME2) product contains soil moisture estimates derived from NISAR data using three different algorithms at agricultural field-scale (200m) posting for most regions (the Sahara Desert will be at 500m). Soil moisture information can be used for reservoir management, early warning of droughts, irrigation scheduling, and crop yield forecasting.
## Summary ¶
The table below summarizes the characteristics of NISAR data products.
Table 1 : NISAR data product overview
Product Pixel spacing (m) Interferometric Geocoded Layers Additional layers Comments
RSLC NA individual binary raster layers representing complex signal return for each polarization layer 2D LUT s provided to convert from digital numbers to beta-naught, sigma-naught, and gamma-naught zero-Doppler geometry,
constant azimuth time interval and one-way slant range spacing
GSLC 5 to 40* ✔ input RSLC into a geocoded map coordinate system 2D LUT s provided to convert from digital numbers to beta-naught, sigma-naught, and gamma-naught;
mask layer indicating water bodies and shadow-layover flattened with respect to the orbit used in the RSLC processing, which eliminates the topographic phase contribution in the GSLC
ROFF 90 ✔ along-track offset, slant range offset
(three layers) offset variances,
correlation surface peak,
cross offset variance,
signal-to-noise ratio distributed without performing any conventional post-processing operation i.e., layers might contain offsets outliers and are not low pass filtered to reduce noise in the data
GOFF 80 ✔ ✔ along-track offset, slant range offset
RIFG 30 ✔ wrapped interferogram coherence magnitude ellipsoid and topography flattened, multi-looked
RUNW 80 ✔ unwrapped interferogram coherence magnitude,
connected components,
ionospheric phase screen,
ionospheric phase screen uncertainty ellipsoid and topography flattened, multi-looked
GUNW 80 ✔ ✔ unwrapped interferogram coherence magnitude
ionospheric phase screen uncertainty interpolation method during geocoding depends on layer data type
20 ✔ ✔ wrapped interferogram coherence magnitude,
GCOV 10, 20, or 80* ✔ polarimetric covariance terms mask,
number of looks,
RTC gamma to sigma factor radiometrically terrain-corrected gamma-naught power
SME2 200 ✔ three soil moisture estimates: disaggregation (DSG),
physical model inversion (PMI),
time series ratio (TSR) soil moisture uncertainty,
DSG algorithm parameters,
PMI crop type and vegetation water content,
TSR algorithm parameters
∗ ^* ∗ depending on range bandwidth
NISAR Data User Guide NISAR Observation Plan Geophysical Products (Level 3) SME2
Questions? Visit the Earthdata Forum or email ASF User Services at uso@asf.alaska.edu
## Accessing NISAR Data

# Accessing NISAR Data
## NISAR Data Access Overview ¶
NISAR mission L-band data products are generated by JPL and archived by ASF . These products, described in the Data Products section , are hosted in NASA’s Earthdata Cloud (EDC) , which uses AWS infrastructure. This allows users to leverage cloud-based access and computation workflows, though the products can also be downloaded to local storage.
There are a range of access options available for NISAR L-band data, supporting a variety of workflows.
NISAR Data Product Availability
NISAR mission data is now available for both L-band and S-band datasets!
Learn more about the available L-band data and the expected timeline for additional product releases .
Visit ISRO’s Bhoonidhi platform to search for beta S-band data products .
### Earthdata Login ¶
Downloading NISAR data requires logging in with your Earthdata Login (EDL) credentials. An EDL account is free to create and provides unified access to Earth science data distributed by NASA’S Earth Observation System Data and Information System (EOSDIS) , independent of the data provider.
Once you have EDL credentials, you can configure a local .netrc file to securely store credentials. With this, you will be able to stream or download NISAR data without explicitly passing your EDL credentials.
Example
A correctly configured .netrc file should look like:
Unix Shell Windows OSGeo4W ~/.netrc
machine urs.earthdata.nasa.gov
login <username>
password <password> C:/Users/<YOUR WINDOWS USERNAME>/.netrc
password <password>
### S-Band Data ¶
S-Band data collected by the NISAR mission is hosted by the Indian Space Research Organisation (ISRO), and can be accessed through ISRO’s Bhoonidhi platform.
## Map-based Web Applications ¶
Map-based web interfaces make it easy to explore data available for a particular geographic location and visualize the extent and characteristics of the products.
ASF ’s Vertex data search site is optimized for searching NASA’s SAR holdings, including NISAR L-band data
NASA’s Earthdata Search provides access to all of NASA’s Earth observation datasets, including NISAR L-band data
ISRO’s Bhoonidhi data hub provides access to NISAR S-band datasets, along with other publicly accessible datasets hosted by ISRO
### Vertex ¶
Vertex was developed by ASF to facilitate search and discovery for NASA’s SAR datasets. Refer to the Vertex User Manual for more guidance on search capabilities.
Learn more about using Vertex to search for NISAR data!
### Earthdata Search ¶
Earthdata Search allows users to search for all of NASA’s Earth observation datasets in one place.
Learn more about using Earthdata Search to access NISAR data!
#### Worldview ¶
Worldview is a user-friendly visualization tool that enables interactive browsing, comparison, and animation of over 1,200 NASA satellite data products. Users can then launch Earthdata Search directly from the Worldview user interface to find source rasters for the desired visualization layer for the selected date.
Learn more about using Worldview to explore NISAR data!
### Bhoonidhi ¶
ISRO’s Bhoonidhi data hub allows users to access S-band data from the NISAR mission, along with other publicly available datasets hosted by ISRO.
## Programmatic Access ¶
The global and reliable regular coverage of the NISAR mission makes it a compelling data source for big data analysis workflows. SAR data is often integrated into complex scripts to perform additional processing and time series analysis, and NISAR data access can be scripted into existing programmatic workflows.
As with the web-based user interfaces, ASF provides programmatic access patterns tailored to SAR datasets, but NISAR data can also be accessed using programmatic tools developed to support a wide range of NASA Earth observation data resources.
ASF provides the asf_search Python package to streamline the process of finding and accessing suitable SAR datasets for a time period and area of interest
The earthaccess Python package provides programmatic access to a range of NASA Earth observation datasets
### ASF Search Python Package ¶
The asf_search Python package allows users to search and download products for all of ASF ’s data collections. It also provides support for compiling lists of SAR acquisitions that are suitable for interferometric time series analysis and other SAR -specific functionality.
Refer to the ASF Data Search Manual to learn about installation options and how to use asf_search to find and download all of ASF ’s SAR holdings.
Learn more about searching for NISAR datasets with the ASF Search Python Package!
### Earthaccess Python Package ¶
The earthaccess Python package allows users to access NASA Earth observation datasets programmatically. The development of this package is facilitated by NASA Openscapes , an initiative to support researchers using data hosted in NASA’s Earthdata Cloud .
Learn more about using earthaccess with NISAR datasets!
## Direct AWS S3 Access ¶
Because all NISAR data is hosted in EDC , which leverages AWS infrastructure, users can access the data directly in S3 using the AWS CLI or other supported methods.
Learn more about Direct AWS S3 Access!
## GDAL Access ¶
GDAL’s vsicurl virtual file system driver allows users to subset NISAR HDF5 files without downloading the entire HDF5 file first or leveraging Harmony services .
Learn more about using GDAL to transform HDF5 files!
Documentation Data Processing Algorithms Documentation Vertex
Questions? Visit the Earthdata Forum or email ASF User Services at uso@asf.alaska.edu
## Using NISAR Data

# Using NISAR Data Overview
There are many potential usage patterns for NISAR data, from SAR scientists downloading RRSD products to perform complex processing workflows to disaster response teams viewing GCOV products in GIS platforms. There are a range of tools and resources available for accessing, processing, analyzing and visualizing NISAR products to support this range of use cases.
## Accessing NISAR Data ¶
NISAR data can be accessed from cloud storage, either by downloading or using cloud computing approaches to work with the data directly in the cloud. There are map-based user interfaces and programmatic solutions for finding and accessing NISAR data. Refer to Accessing NISAR Data for more information.
## Processing Software ¶
The processing algorithms used for the NISAR Mission are included in ISCE3 , the third iteration of the In SAR Scientific Computing Environment (ISCE). ISCE3 is an open source library for processing spaceborne and airborne Interferometric Synthetic Aperture Radar (In SAR ) data, and development is currently funded through the NISAR project.
The NISAR Mission is using ISCE3 functionality to generate the products that are archived by ASF . This software package is also publicly available for users who want to script their own processing workflows, but this requires scientific programming expertise and an understanding of the principles of SAR acquisitions.
## Programmatic Approaches ¶
Users who want to develop programmatic workflows to access, analyze, and visualize NISAR data can use a range of existing open-source software packages. Functions from packages specifically designed for working with SAR data can be combined with functions from more general packages for working with raster and array data to accomplish a range of analyses and visualizations.
Refer to the Open Source Software page for a list of open source software packages available for working with NISAR data.
Refer to NISAR Tutorials for more information and available workflows.
## GIS Software ¶
The NISAR mission generates a number of Level 2 and 3 products , which are projected to map coordinates and are suitable for use in GIS workflows. Any of the gridded datasets in the Level 2 and 3 products can be added to ArcGIS Pro or QGIS . The amplitude component of SAR data is particularly well-suited to GIS analysis, as it presents an image of the Earth’s surface.
### Amplitude Products ¶
Radar backscatter values can be extracted from either Geocoded Covariance (GCOV) or Geocoded Single Look Complex (GSLC) products. Refer to Amplitude Datasets to learn more about the differences and determine which product may be better suited for your workflow.
If you are new to NISAR data and want to explore what amplitude data looks like, the GCOV products are more straightforward to use in GIS than the GSLC s.
### Coherence ¶
Among the non-amplitude datasets, the Coherence layers from the Geocoded Unwrapped Interferogram (GUNW) products may be of interest to GIS users. Coherence represents the correlation of phase measurements from one SAR acquisition to the next, which can also indicate areas that have undergone changes in surface structure.
The pixel values of a Coherence layer range from 0 to 1. Low coherence values often indicate areas that have undergone disturbance, while high coherence values tend to indicate areas with more stable conditions.
### Soil Moisture ¶
The Soil Moisture (SME2) products are the only Level 3 NISAR products generated by the mission. SME2 products contain several soil moisture layers generated using different approaches, all of which are easily added to GIS projects.
### File Size and Format ¶
NISAR files are very large, and it can take a long time to load them into GIS projects. If your area of interest is smaller than the full extent of the product, you may want to consider subsetting the data before using them for analysis workflows. This is particularly important if you choose to work with GSLC products.
The HDF5 data format of the NISAR products may be unfamiliar to some users, but there are workflows for adding NISAR layers to GIS projects and performing analysis leveraging existing raster analysis tools.
### Guidance ¶
Refer to NISAR Support in Arc GIS Pro to learn how to work with NISAR data in Arc GIS Pro and Using NISAR Data in Q GIS for guidance on using NISAR data in Q GIS .
Documentation GDAL Documentation Open Source Software
Questions? Visit the Earthdata Forum or email ASF User Services at uso@asf.alaska.edu
## Tools and Services

# Tools and Services Overview
## Earthdata Tools and Services ¶
ASF is working in collaboration with other development teams across the Earthdata ecosystem to make NISAR data available using existing Earthdata tools and platforms, including:
Worldview
NASA Harmony
Earthdata GIS (EGIS)
HyP3
Refer to the Tools and Services Roadmap to check the status of these development efforts.
### Worldview ¶
NASA’s Worldview is a powerful visualization platform, allowing users to browse hundreds of different NASA datasets. Users can view the extent of available acquisitions through time, compare different datasets or acquisition dates, and generate time series animations.
NISAR GCOV Layers Available in Worldview!
NISAR PROVISIONAL Geocoded Polarimetric Covariance (GCOV) layers are now available to explore on Worldview !
Learn more about the layers and how to leverage visualization tools in Worldview.
### NASA Harmony ¶
NASA’s Harmony service allows users to transform NASA datasets, customizing the output to better meet their needs.
For NISAR products, Harmony services are being developed to support subsetting a NISAR HDF5 by dataset or geographic range, with the option for some output products to be generated in a different file format or projection.
Learn more about the Harmony services that are currently available.
### Earthdata GIS ¶
NASA’s Earthdata GIS (EGIS) platform provides content that can be leveraged interactively in web maps or applications and GIS software platforms. Arc GIS Image Services allow users to interact with source rasters without having to download the data first, but the NISAR data format makes it challenging to leverage image services without first transforming the source rasters.
ASF is working with Esri and the EGIS team to explore potential methods of service publication that minimize storage while still providing a performant user experience.
### HyP3 ¶
ASF ’s Hybrid Pluggable Processing Pipeline (HyP3) is a cloud-native processing platform designed to efficiently generate analysis-ready data products on demand in response to user requests. Originally designed to apply complex scientific workflows to Sentinel-1 SAR data, the platform can be used for any on-demand processing workflow that benefits from leveraging cloud computing to output higher-level products.
ASF is planning to support on-demand generation of NISAR products using HyP3. Development effort is already underway in collaboration with the VolcSARvatory project for generating GUNW products using custom date pairs, along with an Earth Action project supporting on-demand processing of Level 3 products from select NISAR Science Algorithms .
Documentation Citing NISAR Data Documentation Worldview
Questions? Visit the Earthdata Forum or email ASF User Services at uso@asf.alaska.edu
## Tutorials

# NISAR Tutorials
## NISAR Tutorials ¶
There are a range of tutorials available for working with NISAR data.
### StoryMap Tutorials ¶
For those interested in learning more about potential applications and GIS -based workflows, refer to the interactive StoryMap tutorials published by ASF and JPL.
### Python Notebooks ¶
Python-based resources are available for those working with NISAR data programmatically. ASF has published a NISAR Cookbook , and Python notebooks are available from the NISAR Science Team for a number of higher-level products.
Documentation ASF Roadmap Documentation StoryMap Tutorials
Questions? Visit the Earthdata Forum or email ASF User Services at uso@asf.alaska.edu
## Applications

# Applications Overview
NISAR data can be used for a broad range of applications, as indicated by the figure below.
Figure 1 : NISAR applications overview
More information related to applications can be found in the NASA-ISRO SAR (NISAR) Mission Science Users’ Handbook NISAR, 2025 , applications white papers and the Algorithm Theoretical Basis Documents (ATBDs) . There are also ATBDs for a number of higher level products available as Python notebooks .
Refer also to the interactive NISAR StoryMap Tutorials illustrating how NISAR data can be used for a range of applications.
References ¶
- NISAR. (2025). NASA-ISRO SAR (NISAR) Mission Science Users’ Handbook, Second Edition (Second Edition). NASA Jet Propulsion Laboratory. 10.48577/jpl.UD4HV3 Resources Glossary Resources Amplitude
Questions? Visit the Earthdata Forum or email ASF User Services at uso@asf.alaska.edu

## Catatan untuk project

- GCOV (Level 2) paling relevan untuk habitat/hutan/gambut & disturbance.
- L-band (~24 cm) menembus kanopi lebih dalam dari C-band Sentinel-1 — cocok metafora “menembus asap” di UI/game.
- Akses: Vertex, Earthdata Search, `asf_search`, `earthaccess`, S3/GDAL.
